import {
  Dispatch,
  FormEvent,
  MouseEvent,
  SetStateAction,
  useRef,
  useState,
} from "react";
import Modal from "./Modal";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/utils/firebase";
import { FirebaseTimestamp, GroupedTasks, Task } from "@/types/tasks";
import { formatDate } from "@/utils";
import { Timestamp } from "firebase/firestore";

type Props = {
  handleModalClose: () => void;
  type: "post" | "edit" | "view" | "delete";
  selectedTask?: Task | null;
  setTasks: Dispatch<SetStateAction<GroupedTasks>>;
};

const TaskModal = ({
  handleModalClose,
  type,
  selectedTask,
  setTasks,
}: Props) => {
  const [user] = useAuthState(auth);

  const taskFormRef = useRef<HTMLFormElement | null>(null);
  const [taskSaveEnabled, setTaskSaveEnabled] = useState(false);
  const [pageLoading, setPageLoading] = useState<boolean>(false);

  const handleMainDivClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const checkIfSubmitCanBeEnabled = (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    e: any,
    checkFor: "title" | "description" | "due-date"
  ) => {
    if (checkFor === "due-date") {
      const dueDateSec = new Date(e.target.value).getTime() / 1000;
      if (
        !dueDateSec ||
        isNaN(dueDateSec) ||
        (selectedTask?.dueDate?._seconds &&
          formatDate(dueDateSec) === formatDate(selectedTask.dueDate._seconds))
      ) {
        setTaskSaveEnabled(false);
        return;
      }
    }

    if (checkFor === "title") {
      const title = e.target.value;
      if (type === "post") {
        if (!title || !title.trim()) {
          setTaskSaveEnabled(false);
          return;
        }
      }

      if (type === "edit") {
        if (title.trim() === selectedTask?.name) {
          setTaskSaveEnabled(false);
          return;
        }
      }
    }

    if (checkFor === "description") {
      const description = e.target.value;

      if (type === "edit") {
        if (description.trim() === selectedTask?.description) {
          setTaskSaveEnabled(false);
          return;
        }
      }
    }

    setTaskSaveEnabled(true);
  };

  const handleModalCloseHelper = () => {
    if (pageLoading) {
      return;
    }
    handleModalClose();
  };

  const handleTaskFormSubmit = async (e: FormEvent) => {
    try {
      e.preventDefault();

      setPageLoading(true);

      if (!user) {
        console.error("User unauthenticated!");
        return;
      }

      const form = taskFormRef.current || undefined;
      const formData = new FormData(form);

      const title =
        (formData.get("title") && String(formData.get("title"))) || null;
      const description =
        (formData.get("description") && String(formData.get("description"))) ||
        null;
      const dueDate =
        (formData.get("due_date") && String(formData.get("due_date"))) || null;

      let firebaseDueDate = null;
      if (dueDate) {
        firebaseDueDate = new Date(dueDate).getTime() / 1000;
      }
      console.log("firebaseDueDate: ", firebaseDueDate);

      if (type === "post") {
        if (!title) {
          console.error("Title Empty!");
          return;
        }

        const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URI}/tasks`;
        const jwtToken = await user.getIdToken();
        console.log("creating task...");
        const req = await fetch(url, {
          method: "POST",
          body: JSON.stringify({
            name: title,
            description,
            dueDate: firebaseDueDate,
          }),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        console.log("Task Created!");

        const res = await req.json();
        console.log("Response from backend: ", res);

        if ((req.status === 200, res.task)) {
          setTasks((prevTasks) => {
            const todo: Task[] = [...prevTasks.todo, res.task];

            return {
              ...prevTasks,
              todo,
            };
          });
        }
      } else if (type === "edit" && selectedTask) {
        console.log("editing task...");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = {
          ...(title && title !== selectedTask.name ? { name: title } : {}),
          ...(description && description !== selectedTask?.description
            ? { description }
            : {}),
          ...(firebaseDueDate &&
          firebaseDueDate !==
            (selectedTask.dueDate?._seconds
              ? selectedTask?.dueDate._seconds
              : 0)
            ? { dueDate: firebaseDueDate }
            : {}),
        };

        console.log("edited data: ", data, Timestamp.fromMillis(data.dueDate));
        if (!Object.entries(data).length) {
          console.error("Nothing to edit in task: ", selectedTask.taskId);
          return;
        }

        const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URI}/tasks/${selectedTask.taskId}`;
        const jwtToken = await user.getIdToken();
        const req = await fetch(url, {
          method: "PATCH",
          body: JSON.stringify(data),
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        console.log("Task Edited!: ", selectedTask.taskId);

        const res = await req.json();
        console.log("Response from backend: ", res, req.status);

        if ((req.status === 200, res.taskId)) {
          setTasks((prevTasks) => {
            const todo: Task[] = prevTasks.todo.map((t: Task) => {
              if (t.taskId !== selectedTask.taskId) {
                return t;
              }
              return {
                ...t,
                ...(data.name ? { name: data.name } : {}),
                ...(data.description ? { description: data.description } : {}),
                ...(data.dueDate
                  ? {
                      // @ts-expect-error: Timestamp type is not working
                      dueDate: Timestamp.fromMillis(
                        data.dueDate
                      ) as FirebaseTimestamp,
                    }
                  : {}),
              };
            });

            const inProgress: Task[] = prevTasks["in progress"].map(
              (t: Task) => {
                if (t.taskId !== selectedTask.taskId) {
                  return t;
                }
                console.log(
                  "dueDate in set",
                  data.dueDate
                    ? {
                        // @ts-expect-error: Timestamp type is not working
                        dueDate: Timestamp.fromMillis(
                          data.dueDate
                        ) as FirebaseTimestamp,
                      }
                    : {}
                );
                return {
                  ...t,
                  ...(data.name ? { name: data.name } : {}),
                  ...(data.description
                    ? { description: data.description }
                    : {}),
                  ...(data.dueDate
                    ? {
                        dueDate: {
                          _seconds: Timestamp.fromMillis(data.dueDate).seconds,
                          _nanoseconds: Timestamp.fromMillis(data.dueDate)
                            .nanoseconds,
                        },
                      }
                    : {}),
                };
              }
            );

            const done: Task[] = prevTasks.done.filter((t: Task) => {
              if (t.taskId !== selectedTask.taskId) {
                return t;
              }
              return {
                ...t,
                ...(data.name ? { name: data.name } : {}),
                ...(data.description ? { description: data.description } : {}),
                ...(data.dueDate
                  ? {
                      // @ts-expect-error: Timestamp type is not working
                      dueDate: Timestamp.fromMillis(
                        data.dueDate
                      ) as FirebaseTimestamp,
                    }
                  : {}),
              };
            });

            return {
              todo,
              "in progress": inProgress,
              done,
            };
          });
        }
      }
    } catch (error) {
      console.error("Error(handleTaskFormSubmit): ", error);
    } finally {
      setPageLoading(false);
      handleModalClose();
    }
  };

  const handleSelectedTaskDelete = async () => {
    try {
      setPageLoading(true);

      if (!selectedTask || !user) {
        console.error("No task selected to delete");
        return;
      }

      console.log("Deleting Task...");
      const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URI}/tasks/${selectedTask.taskId}`;
      const jwtToken = await user.getIdToken();
      const req = await fetch(url, {
        method: "DELETE",
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      console.log("Task Deleted!");

      const res = await req.json();
      if (req.status === 200) {
        const selectedTaskId = selectedTask.taskId;

        setTasks((prevTasks) => {
          const todo: Task[] = prevTasks.todo.filter(
            (t: Task) => t.taskId !== selectedTaskId
          );

          const inProgress: Task[] = prevTasks["in progress"].filter(
            (t: Task) => t.taskId !== selectedTaskId
          );

          const done: Task[] = prevTasks.done.filter(
            (t: Task) => t.taskId !== selectedTaskId
          );

          return {
            todo,
            "in progress": inProgress,
            done,
          };
        });
      }
      console.log("Response from backend: ", res);
    } catch (error) {
      console.error("Error(handleSelectedTaskDelete): ", error);
    } finally {
      setPageLoading(false);
      handleModalClose();
    }
  };

  return (
    <Modal>
      <div
        className="w-full flex max-h-screen justify-center items-center px-[15rem] py-[7.5rem]"
        onClick={() => handleModalCloseHelper()}
      >
        <div
          className="w-full h-full flex flex-col bg-white text-black p-4 rounded-md z-50"
          onClick={(e) => handleMainDivClick(e)}
        >
          <h1 className="font-bold text-xl">
            {type === "edit" ? "Edit Task:" : null}
            {type === "post" ? "Create Task:" : null}
            {type === "view" ? "Task Details:" : null}
            {type === "delete" ? "Delete Task:" : null}
          </h1>

          {["edit", "post"].includes(type) ? (
            <form
              ref={taskFormRef}
              onSubmit={(e) => handleTaskFormSubmit(e)}
              className="mt-6 flex flex-col gap-5 justify-between grow"
            >
              <div className="flex flex-col gap-5">
                <div className="flex flex-col gap-1">
                  <label
                    className="text-sm text-gray-600 font-semibold"
                    htmlFor=""
                  >
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    defaultValue={selectedTask?.name}
                    onChange={(e) => checkIfSubmitCanBeEnabled(e, "title")}
                    className="border-b border-gray-400 outline-none font-medium"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    className="text-sm text-gray-600 font-semibold"
                    htmlFor="description"
                  >
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    onChange={(e) =>
                      checkIfSubmitCanBeEnabled(e, "description")
                    }
                    defaultValue={selectedTask?.description || undefined}
                    className="border-b border-gray-400 outline-none"
                    rows={5}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label
                    className="text-sm text-gray-600 font-semibold"
                    htmlFor="due_date"
                  >
                    Due Date
                  </label>
                  <input
                    id="due_date"
                    name="due_date"
                    type="datetime-local"
                    onChange={(e) => checkIfSubmitCanBeEnabled(e, "due-date")}
                    className="border-b border-gray-400 outline-none"
                  />
                </div>
              </div>

              <div className="self-end flex gap-x-4">
                {type === "post" ? (
                  <button
                    className={`self-end px-3 py-1 rounded-md disabled:cursor-not-allowed ${taskSaveEnabled ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
                    // onClick={() => handleModalCloseHelper()}
                    disabled={!taskSaveEnabled}
                    type="submit"
                  >
                    Create
                  </button>
                ) : null}

                {type === "edit" ? (
                  <button
                    className={`self-end px-3 py-1 rounded-md disabled:cursor-not-allowed ${taskSaveEnabled ? "bg-blue-600 text-white" : "bg-gray-200 text-black"}`}
                    // onClick={() => handleModalCloseHelper()}
                    disabled={!taskSaveEnabled}
                    type="submit"
                  >
                    Save
                  </button>
                ) : null}

                <button
                  className={`self-end  bg-red-500 px-2 py-1 rounded-md text-white`}
                  onClick={() => handleModalCloseHelper()}
                  type="button"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          {["view", "delete"].includes(type) && selectedTask ? (
            <div className="mt-6 flex flex-col gap-5 justify-between grow">
              <div className="flex flex-col gap-5">
                <h2 className="font-bold text-lg">{`Title: ${selectedTask.name}`}</h2>

                <h4 className="font-semibold text-base text-gray-600">{`Description: ${selectedTask.description}`}</h4>

                <h6 className="font-semibold text-base text-gray-600">{`Created at: ${formatDate(selectedTask.createdAt._seconds)}`}</h6>
              </div>

              <div className="self-end flex gap-x-4">
                {type === "view" ? (
                  <button
                    className="self-end bg-blue-600 px-2 py-1 rounded-md text-white"
                    onClick={() => handleModalCloseHelper()}
                    type="button"
                  >
                    Close
                  </button>
                ) : null}

                {type === "delete" ? (
                  <>
                    <button
                      className="self-end bg-red-500 px-2 py-1 rounded-md text-white"
                      onClick={() => handleSelectedTaskDelete()}
                      type="button"
                    >
                      Delete
                    </button>

                    <button
                      className={`self-end  bg-gray- px-2 py-1 rounded-md bg-gray-200 text-black`}
                      onClick={() => handleModalCloseHelper()}
                      type="button"
                    >
                      Cancel
                    </button>
                  </>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
};

export default TaskModal;
