import { TaskStatus } from "@/constants/tasks";

export type FirebaseTimestamp = {
  _seconds: number;
  _nanoseconds: number;
};

export type Task = {
  taskId: string;
  name: string;
  description: string | null;
  user_id: string;
  dueDate: FirebaseTimestamp | null;
  createdAt: FirebaseTimestamp;
  updatedAt: FirebaseTimestamp;
  status: TaskStatus;
};

export type GroupedTasks = {
  todo: Task[];
  "in progress": Task[];
  done: Task[];
};

export type ModalType = "view" | "edit" | "post" | "delete";
