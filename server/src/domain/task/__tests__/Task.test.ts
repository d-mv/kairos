import { describe, it, expect } from "vitest";
import { Task } from "../Task.js";
import { TaskCreated, TaskCompleted, TaskReopened } from "../TaskDomainEvents.js";

describe("Task", () => {
  describe("create", () => {
    it("creates a basic task", () => {
      const result = Task.create("Write tests", "user-1");
      expect(result.isOk).toBe(true);
      const task = result.value;
      expect(task.title).toBe("Write tests");
      expect(task.status).toBe("todo");
      expect(task.priority).toBe(1);
      expect(task.isSubtask()).toBe(false);
      expect(task.isInInbox()).toBe(true);
    });

    it("trims whitespace from title", () => {
      const result = Task.create("  Write tests  ", "user-1");
      expect(result.value.title).toBe("Write tests");
    });

    it("fails on empty title", () => {
      const result = Task.create("", "user-1");
      expect(result.isErr).toBe(true);
    });

    it("creates with project assignment", () => {
      const result = Task.create("T", "u", { projectId: "proj-1" });
      expect(result.value.projectId).toBe("proj-1");
      expect(result.value.isInInbox()).toBe(false);
    });

    it("creates with duration and unit", () => {
      const result = Task.create("T", "u", { duration: 3, durationUnit: "h" });
      expect(result.isOk).toBe(true);
      expect(result.value.duration).toBe(3);
      expect(result.value.durationUnit).toBe("h");
    });

    it("fails when duration is set without duration unit", () => {
      const result = Task.create("T", "u", { duration: 3 });
      expect(result.isErr).toBe(true);
    });

    it("fails when duration is not positive", () => {
      const result = Task.create("T", "u", { duration: 0, durationUnit: "d" });
      expect(result.isErr).toBe(true);
    });

    it("creates a subtask", () => {
      const result = Task.create("Sub", "u", { parentTaskId: "parent-1" });
      expect(result.isOk).toBe(true);
      expect(result.value.isSubtask()).toBe(true);
      expect(result.value.parentTaskId).toBe("parent-1");
    });

    it("fails when subtask tries to have project", () => {
      const result = Task.create("Sub", "u", {
        parentTaskId: "parent-1",
        projectId: "proj-1",
      });
      expect(result.isErr).toBe(true);
    });

    it("fails when task has both project and area", () => {
      const result = Task.create("T", "u", {
        projectId: "proj-1",
        areaId: "area-1",
      });
      expect(result.isErr).toBe(true);
    });

    it("emits TaskCreated event", () => {
      const task = Task.create("T", "u").value;
      expect(task.domainEvents).toHaveLength(1);
      expect(task.domainEvents[0]).toBeInstanceOf(TaskCreated);
    });
  });

  describe("complete / reopen", () => {
    it("completes a task", () => {
      const task = Task.create("T", "u").value;
      task.clearDomainEvents();
      const result = task.complete();
      expect(result.isOk).toBe(true);
      expect(task.status).toBe("done");
      expect(task.domainEvents[0]).toBeInstanceOf(TaskCompleted);
    });

    it("fails to complete an already completed task", () => {
      const task = Task.create("T", "u").value;
      task.complete();
      const result = task.complete();
      expect(result.isErr).toBe(true);
    });

    it("reopens a completed task", () => {
      const task = Task.create("T", "u").value;
      task.complete();
      task.clearDomainEvents();
      const result = task.reopen();
      expect(result.isOk).toBe(true);
      expect(task.status).toBe("todo");
      expect(task.domainEvents[0]).toBeInstanceOf(TaskReopened);
    });

    it("fails to reopen a non-completed task", () => {
      const task = Task.create("T", "u").value;
      const result = task.reopen();
      expect(result.isErr).toBe(true);
    });
  });

  describe("ownership", () => {
    it("assigns to project and clears area", () => {
      const task = Task.create("T", "u", { areaId: "area-1" }).value;
      const result = task.assignToProject("proj-1");
      expect(result.isOk).toBe(true);
      expect(task.projectId).toBe("proj-1");
      expect(task.areaId).toBeNull();
    });

    it("assigns to area and clears project", () => {
      const task = Task.create("T", "u", { projectId: "proj-1" }).value;
      const result = task.assignToArea("area-1");
      expect(result.isOk).toBe(true);
      expect(task.areaId).toBe("area-1");
      expect(task.projectId).toBeNull();
    });

    it("moves to inbox", () => {
      const task = Task.create("T", "u", { projectId: "proj-1" }).value;
      const result = task.moveToInbox();
      expect(result.isOk).toBe(true);
      expect(task.isInInbox()).toBe(true);
    });

    it("subtask cannot be assigned to project", () => {
      const task = Task.create("T", "u", { parentTaskId: "parent-1" }).value;
      const result = task.assignToProject("proj-1");
      expect(result.isErr).toBe(true);
    });

    it("subtask cannot be moved to inbox", () => {
      const task = Task.create("T", "u", { parentTaskId: "parent-1" }).value;
      const result = task.moveToInbox();
      expect(result.isErr).toBe(true);
    });
  });

  describe("duration", () => {
    it("updates duration and duration unit", () => {
      const task = Task.create("T", "u").value;
      task.updateDuration(2, "w");
      expect(task.duration).toBe(2);
      expect(task.durationUnit).toBe("w");
    });

    it("clears duration and duration unit", () => {
      const task = Task.create("T", "u", { duration: 1, durationUnit: "m" }).value;
      task.updateDuration(null, null);
      expect(task.duration).toBeNull();
      expect(task.durationUnit).toBeNull();
    });
  });

  describe("canHaveSubtask", () => {
    it("returns ok for a top-level task", () => {
      const task = Task.create("T", "u").value;
      expect(task.canHaveSubtask().isOk).toBe(true);
    });

    it("returns error for a subtask", () => {
      const task = Task.create("T", "u", { parentTaskId: "p" }).value;
      expect(task.canHaveSubtask().isErr).toBe(true);
    });
  });
});
