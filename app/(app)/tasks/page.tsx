"use client";

import { useAuthState } from "react-firebase-hooks/auth";

import { auth } from "@/utils/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import TaskModal from "@/components/TaskModal";
import { GroupedTasks, ModalType, Task } from "@/types/tasks";
import { TaskStatus } from "@/constants/tasks";
import { formatDate } from "@/utils";
// import Draggable from "react-draggable";

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

      <div className="my-6 grid grid-cols-3 gap-2">
        {Object.entries(tasks).map((item) => (
          <div
            key={item[0]}
            className={`shadow-gray-200 shadow-md border rounded-md p-2 px-3 flex flex-col gap-4 relative h-96 md:h-[25rem] lg:h-[30rem] overflow-auto`}
          >
            <h2 className="bg-blue-500 text-white px-2 py-1 rounded-sm font-semibold sticky top-0">
              {item[0].toUpperCase()}
            </h2>

            <div className="flex flex-col gap-2 mb-8">
              {item[1].map((task) => (
                <div
                  className="bg-blue-100 w-[98%] mx-auto p-2 rounded flex flex-col"
                  key={task.taskId + task.name}
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
              ))}
            </div>
          </div>
        ))}
      </div>

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
