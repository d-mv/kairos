import { describe, it, expect } from "vitest";
import { Project } from "../Project.js";
import { ProjectCreated, ProjectRenamed, ProjectMovedToArea } from "../ProjectDomainEvents.js";
describe("Project", () => {
    describe("create", () => {
        it("creates a project with a name and userId", () => {
            const result = Project.create("My Project", "user-1");
            expect(result.isOk).toBe(true);
            const project = result.value;
            expect(project.name).toBe("My Project");
            expect(project.userId).toBe("user-1");
            expect(project.areaId).toBeNull();
        });
        it("creates with an area", () => {
            const result = Project.create("My Project", "user-1", "area-1");
            expect(result.value.areaId).toBe("area-1");
        });
        it("fails when name is empty", () => {
            const result = Project.create("", "user-1");
            expect(result.isErr).toBe(true);
        });
        it("trims whitespace", () => {
            const result = Project.create("  Kairos  ", "user-1");
            expect(result.value.name).toBe("Kairos");
        });
        it("emits ProjectCreated event", () => {
            const result = Project.create("Kairos", "user-1", "area-1");
            const project = result.value;
            expect(project.domainEvents).toHaveLength(1);
            const event = project.domainEvents[0];
            expect(event).toBeInstanceOf(ProjectCreated);
            expect(event.name).toBe("Kairos");
            expect(event.areaId).toBe("area-1");
        });
    });
    describe("rename", () => {
        it("renames the project", () => {
            const project = Project.create("Old Name", "user-1").value;
            project.clearDomainEvents();
            const result = project.rename("New Name");
            expect(result.isOk).toBe(true);
            expect(project.name).toBe("New Name");
        });
        it("emits ProjectRenamed event", () => {
            const project = Project.create("Old", "user-1").value;
            project.clearDomainEvents();
            project.rename("New");
            const event = project.domainEvents[0];
            expect(event).toBeInstanceOf(ProjectRenamed);
            expect(event.oldName).toBe("Old");
            expect(event.newName).toBe("New");
        });
        it("fails on empty name", () => {
            const project = Project.create("Old", "user-1").value;
            const result = project.rename("");
            expect(result.isErr).toBe(true);
            expect(project.name).toBe("Old");
        });
    });
    describe("moveToArea", () => {
        it("assigns to an area", () => {
            const project = Project.create("P", "user-1").value;
            project.clearDomainEvents();
            project.moveToArea("area-99");
            expect(project.areaId).toBe("area-99");
            const event = project.domainEvents[0];
            expect(event).toBeInstanceOf(ProjectMovedToArea);
            expect(event.areaId).toBe("area-99");
        });
        it("can unassign from area (set to null)", () => {
            const project = Project.create("P", "user-1", "area-1").value;
            project.clearDomainEvents();
            project.moveToArea(null);
            expect(project.areaId).toBeNull();
        });
    });
    describe("reconstitute", () => {
        it("restores from persistence without emitting events", () => {
            const now = new Date();
            const project = Project.reconstitute("proj-id", {
                name: "My Project",
                areaId: "area-1",
                userId: "user-1",
                createdAt: now,
                updatedAt: now,
            });
            expect(project.id).toBe("proj-id");
            expect(project.domainEvents).toHaveLength(0);
        });
    });
});
//# sourceMappingURL=Project.test.js.map