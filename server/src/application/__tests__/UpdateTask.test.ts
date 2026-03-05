import { beforeEach, describe, expect, it } from "vitest";
import { CreateTask } from "../task/CreateTask.js";
import { UpdateTask } from "../task/UpdateTask.js";
import { InMemoryTaskRepository, SpyEventBus } from "./mocks.js";

describe("UpdateTask use case", () => {
  let taskRepo: InMemoryTaskRepository;
  let eventBus: SpyEventBus;
  let createTask: CreateTask;

  beforeEach(() => {
    taskRepo = new InMemoryTaskRepository();
    eventBus = new SpyEventBus();
    createTask = new CreateTask(taskRepo, eventBus);
  });

  it("normalizes bare links when updating task title", async () => {
    const created = await createTask.execute({ title: "Draft", userId: "u1" });
    const updateTask = new UpdateTask(
      taskRepo,
      eventBus,
      async (title) =>
        title.replace(
          "https://kairos-web.fly.dev/inbox",
          "[Kairos](https://kairos-web.fly.dev/inbox)",
        ),
    );

    const updated = await updateTask.execute({
      id: created.value.id,
      userId: "u1",
      title: "Open https://kairos-web.fly.dev/inbox",
    });

    expect(updated.isOk).toBe(true);
    expect(updated.value.title).toBe("Open [Kairos](https://kairos-web.fly.dev/inbox)");
  });
});
