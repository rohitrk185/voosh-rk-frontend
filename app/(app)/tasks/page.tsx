"use client";

import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "@/utils/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskModal from "@/components/TaskModal";
import { GroupedTasks, ModalType, Task } from "@/types/tasks";
import { TaskStatus } from "@/constants/tasks";
import { formatDate } from "@/utils";
import { DragDropContext, Draggable, Droppable } from "react-beautiful-dnd";

type ModalDetails = {
  show: boolean;
  type: ModalType;
};

export default function Tasks() {
  const router = useRouter();
  const [user, loading, error] = useAuthState(auth);
  const [tasks, setTasks] = useState<GroupedTasks>({
    todo: [],
    "in progress": [],
    done: [],
  });
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [modal, setModal] = useState<ModalDetails>({
    show: false,
    type: "post",
  });

  useEffect(() => {
    if (!user) {
      router.replace("/login");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user) {
      return;
    }

    const fetchTasks = async () => {
      try {
        const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URI}/tasks`;
        const jwtToken = await user.getIdToken();
        const req = await fetch(url, {
          method: "GET",
          headers: {
            "Content-type": "application/json; charset=UTF-8",
            Authorization: `Bearer ${jwtToken}`,
          },
        });
        const res = await req.json();
        const _tasks = res.tasks;
        if (Array.isArray(_tasks) && _tasks.length) {
          const todo: Task[] = _tasks.filter(
            (t: Task) => t.status === TaskStatus.todo
          );

          const inProgress: Task[] = _tasks.filter(
            (t: Task) => t.status === TaskStatus["in-progress"]
          );

          const done: Task[] = _tasks.filter(
            (t: Task) => t.status === TaskStatus.completed
          );
          setTasks({
            todo,
            "in progress": inProgress,
            done,
          });
        }
        console.log("Response from backend: ", res);
      } catch (error) {
        console.error("Failed to Fetch: ", error);
      }
    };
    fetchTasks();
  }, [user]);

  const handleRefresh = async () => {
    router.refresh();
  };

  const handleModalClose = () => {
    setModal({
      show: false,
      type: "post",
    });
  };

  const handleModalOpen = (type: ModalType) => {
    setModal({
      show: true,
      type,
    });
  };

  const handleAddTask = () => {
    handleModalOpen("post");
  };

  const handleTaskOption = (task: Task, type: ModalType) => {
    setSelectedTask(task);
    handleModalOpen(type);
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    if (!newStatus || !user) {
      console.log(
        "Invalid status for task | no user found: ",
        taskId,
        user?.uid
      );
      return;
    }
    try {
      const url = `${process.env.NEXT_PUBLIC_BACKEND_API_URI}/tasks/${taskId}`;
      const jwtToken = await user.getIdToken();
      const req = await fetch(url, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
          Authorization: `Bearer ${jwtToken}`,
        },
      });
      console.log("Task Edited!: ", taskId);

      const res = await req.json();
      console.log("Response from backend: ", res, req.status);
    } catch (error) {
      console.error("Error(updateTaskStatus): ", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleOnDragEnd = (result: any) => {
    console.log("result.destination: ", result.destination);
    if (!result.destination) return;

    const { source, destination } = result;
    const sourceColumn = source.droppableId;
    const destColumn = destination.droppableId;

    if (sourceColumn === destColumn) {
      // Reordering within the same column
      const columnTasks = Array.from(tasks[sourceColumn as keyof GroupedTasks]);
      const [reorderedItem] = columnTasks.splice(source.index, 1);
      columnTasks.splice(destination.index, 0, reorderedItem);

      console.log("movedItem: ", reorderedItem);

      setTasks({
        ...tasks,
        [sourceColumn]: columnTasks,
      });

      console.log("updating status of task...");
      console.log("Updated! status of task...");
    } else {
      // Moving between columns
      const sourceColumnTasks = Array.from(
        tasks[sourceColumn as keyof GroupedTasks]
      );
      const destColumnTasks = Array.from(
        tasks[destColumn as keyof GroupedTasks]
      );
      const [movedItem] = sourceColumnTasks.splice(source.index, 1);
      destColumnTasks.splice(destination.index, 0, movedItem);

      console.log("movedItem: ", movedItem);

      let newStatus = "";
      switch (destColumn) {
        case "todo": {
          console.log("switch- in todo");
          newStatus = TaskStatus.todo;
          break;
        }
        case "in progress": {
          console.log("switch- in in-progress");
          newStatus = TaskStatus["in-progress"];
          break;
        }
        case "done": {
          console.log("switch- in done");
          newStatus = TaskStatus.completed;
          break;
        }
        default: {
          newStatus = TaskStatus.todo;
          break;
        }
      }
      updateTaskStatus(movedItem.taskId, newStatus);

      setTasks({
        ...tasks,
        [sourceColumn]: sourceColumnTasks,
        [destColumn]: destColumnTasks,
      });

      // Here you would typically update the task status on the backend
      // For example: updateTaskStatus(result.draggableId, destColumn);
      console.log(`updating status of task to ${destColumn}...`);
      console.log("Updated! status of task...");
    }
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (error) {
    return (
      <main className="w-screen h-5/6 flex flex-col gap-4 items-center justify-center">
        <h1 className="text-red-500 text-lg">
          Oops! There was an error in fetching your account details...
        </h1>
        <button
          className="border-red-500 bg-red-100 p-1 border rounded-md"
          onClick={handleRefresh}
        >
          Try Again
        </button>
      </main>
    );
  }

  return (
    <main
      className={`mt-10 w-screen max-h-screen px-4 transition-all duration-200 mb-8 ${modal.show ? "!overflow-hidden" : ""}`}
    >
      <div className="flex">
        <button
          className="bg-blue-600 text-white px-12 py-1 rounded-md w-full"
          onClick={() => handleAddTask()}
        >
          Add Task
        </button>
      </div>

      <div className="my-6 mt-10 shadow-gray-200 shadow-md border rounded-md flex justify-between p-2">
        <div className="flex items-center gap-x-2">
          <label
            htmlFor="search"
            className="text-sm"
          >
            Search:{" "}
          </label>
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search..."
            className="border px-2 py-1 rounded-md border-gray-400"
          />
        </div>

        <div className="flex items-center gap-x-2">
          <label
            htmlFor="sortBy"
            className="text-sm"
          >
            Sort By:
          </label>
          <select className="border px-2 py-1 rounded-md border-gray-400">
            <option value={"recent"}>Recent</option>
            <option value={"name"}>Name</option>
          </select>
        </div>
      </div>

      <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="my-6 grid grid-cols-3 gap-2">
          {Object.entries(tasks).map((item) => (
            <div
              key={item[0]}
              className={`shadow-gray-200 shadow-md border rounded-md p-2 px-3 flex flex-col gap-4 relative h-96 md:h-[25rem] lg:h-[30rem] overflow-auto`}
            >
              <h2 className="bg-blue-500 text-white px-2 py-1 rounded-sm font-semibold sticky top-0">
                {item[0].toUpperCase()}
              </h2>

              <Droppable droppableId={item[0]}>
                {(provided, snapshot) => (
                  <div
                    // className="flex flex-col gap-2 mb-8"
                    className={`flex flex-col gap-2 mb-8 min-h-[100px] ${
                      snapshot.isDraggingOver ? "bg-blue-100" : ""
                    }`}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {item[1].map((task, index) => (
                      <Draggable
                        key={task.taskId}
                        draggableId={task.taskId}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            className="bg-blue-100 w-[98%] mx-auto p-2 rounded flex flex-col"
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <h3 className="font-extrabold">{task.name}</h3>
                            <h5 className="text-sm text-gray-600 line-clamp-3 h-[3.75rem] font-semibold">
                              {task.description}
                            </h5>

                            <h6 className="text-xs text-gray-500 font-semibold">
                              <span>{"Created at: "}</span>
                              <span>{formatDate(task.createdAt._seconds)}</span>
                            </h6>

                            <div className="self-end px-1 pb-1 pt-3 flex gap-x-2">
                              <button
                                className="px-2 bg-red-400 rounded text-white"
                                onClick={() => handleTaskOption(task, "delete")}
                              >
                                Delete
                              </button>
                              <button
                                className="px-2 bg-blue-400 rounded text-white"
                                onClick={() => handleTaskOption(task, "edit")}
                              >
                                Edit
                              </button>
                              <button
                                className="px-2 bg-blue-600 rounded text-white"
                                onClick={() => handleTaskOption(task, "view")}
                              >
                                View Details
                              </button>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>

      {/* Modal */}
      {modal.show ? (
        <TaskModal
          selectedTask={selectedTask}
          handleModalClose={handleModalClose}
          type={modal.type}
          setTasks={setTasks}
        />
      ) : null}
    </main>
  );
}
