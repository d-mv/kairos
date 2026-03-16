import { beforeEach, describe, expect, it } from "vitest";
import { CreateBrainFolder } from "../brain/CreateBrainFolder.js";
import { CreateBrainPage } from "../brain/CreateBrainPage.js";
import { ListBrainPages } from "../brain/ListBrainPages.js";
import { CreateCollaborationInvite } from "../collaboration/CreateCollaborationInvite.js";
import { ListNotifications } from "../collaboration/ListNotifications.js";
import { RespondToInvite } from "../collaboration/RespondToInvite.js";
import { CreateProject } from "../project/CreateProject.js";
import { ListProjects } from "../project/ListProjects.js";
import { CreateTask } from "../task/CreateTask.js";
import { ListTasks } from "../task/ListTasks.js";
import {
  InMemoryBrainFolderRepository,
  InMemoryBrainPageRepository,
  InMemoryCollaborationInviteRepository,
  InMemoryCollaborationShareRepository,
  InMemoryProjectRepository,
  InMemoryTaskRepository,
  InMemoryUserDirectory,
  SpyEventBus,
} from "./mocks.js";

describe("Collaboration", () => {
  let userDirectory: InMemoryUserDirectory;
  let inviteRepo: InMemoryCollaborationInviteRepository;
  let shareRepo: InMemoryCollaborationShareRepository;
  let projectRepo: InMemoryProjectRepository;
  let taskRepo: InMemoryTaskRepository;
  let folderRepo: InMemoryBrainFolderRepository;
  let pageRepo: InMemoryBrainPageRepository;
  let eventBus: SpyEventBus;

  beforeEach(() => {
    userDirectory = new InMemoryUserDirectory();
    inviteRepo = new InMemoryCollaborationInviteRepository();
    shareRepo = new InMemoryCollaborationShareRepository();
    projectRepo = new InMemoryProjectRepository();
    taskRepo = new InMemoryTaskRepository();
    folderRepo = new InMemoryBrainFolderRepository();
    pageRepo = new InMemoryBrainPageRepository();
    eventBus = new SpyEventBus();

    userDirectory.add({ id: "owner", email: "owner@example.com" });
    userDirectory.add({ id: "collab", email: "collab@example.com" });
  });

  it("creates a pending invite for a registered user", async () => {
    const createProject = new CreateProject(projectRepo, eventBus);
    const project = await createProject.execute({ name: "Roadmap", userId: "owner" });
    const createInvite = new CreateCollaborationInvite(
      userDirectory,
      inviteRepo,
      shareRepo,
      projectRepo,
      taskRepo,
      folderRepo,
      pageRepo,
    );

    const result = await createInvite.execute({
      senderUserId: "owner",
      recipientEmail: "collab@example.com",
      entityType: "project",
      entityId: project.value.id,
    });

    expect(result.isOk).toBe(true);
    expect(inviteRepo.store.size).toBe(1);
    const invite = [...inviteRepo.store.values()][0]!;
    expect(invite.entityLabel).toBe("Roadmap");
    expect(invite.status).toBe("pending");
  });

  it("rejects invites for users that are not registered", async () => {
    const createProject = new CreateProject(projectRepo, eventBus);
    const project = await createProject.execute({ name: "Roadmap", userId: "owner" });
    const createInvite = new CreateCollaborationInvite(
      userDirectory,
      inviteRepo,
      shareRepo,
      projectRepo,
      taskRepo,
      folderRepo,
      pageRepo,
    );

    const result = await createInvite.execute({
      senderUserId: "owner",
      recipientEmail: "missing@example.com",
      entityType: "project",
      entityId: project.value.id,
    });

    expect(result.isErr).toBe(true);
    expect(result.error).toMatch(/not registered/i);
  });

  it("accepts an invite and exposes the shared project in normal project listing", async () => {
    const createProject = new CreateProject(projectRepo, eventBus);
    const listProjects = new ListProjects(projectRepo);
    const createInvite = new CreateCollaborationInvite(
      userDirectory,
      inviteRepo,
      shareRepo,
      projectRepo,
      taskRepo,
      folderRepo,
      pageRepo,
    );
    const listNotifications = new ListNotifications(inviteRepo);
    const respondToInvite = new RespondToInvite(inviteRepo, shareRepo);
    const project = await createProject.execute({ name: "Roadmap", userId: "owner" });

    await createInvite.execute({
      senderUserId: "owner",
      recipientEmail: "collab@example.com",
      entityType: "project",
      entityId: project.value.id,
    });
    const invite = [...inviteRepo.store.values()][0]!;
    const notificationsBefore = await listNotifications.execute("collab");
    expect(notificationsBefore.value).toHaveLength(1);

    const acceptResult = await respondToInvite.accept(invite.id, "collab");
    expect(acceptResult.isOk).toBe(true);

    projectRepo.share("collab", project.value.id);
    taskRepo.shareProject("collab", project.value.id);

    const notificationsAfter = await listNotifications.execute("collab");
    expect(notificationsAfter.value).toHaveLength(0);

    const listed = await listProjects.execute("collab");
    expect(listed.isOk).toBe(true);
    expect(listed.value.map((item) => item.name)).toContain("Roadmap");
  });

  it("lets collaborators create tasks inside a shared project while keeping owner ownership", async () => {
    const createProject = new CreateProject(projectRepo, eventBus);
    const project = await createProject.execute({ name: "Roadmap", userId: "owner" });
    projectRepo.share("collab", project.value.id);
    taskRepo.shareProject("collab", project.value.id);

    const createTask = new CreateTask(taskRepo, eventBus, async (title) => title, projectRepo);
    const listTasks = new ListTasks(taskRepo);
    const created = await createTask.execute({
      title: "Follow up",
      userId: "collab",
      projectId: project.value.id,
    });

    expect(created.isOk).toBe(true);
    expect(taskRepo.store.get(created.value.id)?.userId).toBe("owner");

    const listed = await listTasks.execute({ userId: "collab", projectId: project.value.id });
    expect(listed.isOk).toBe(true);
    expect(listed.value.map((task) => task.title)).toContain("Follow up");
  });

  it("lets collaborators create pages inside a shared brain folder while keeping owner ownership", async () => {
    const createFolder = new CreateBrainFolder(folderRepo, eventBus);
    const folder = await createFolder.execute({ name: "Reference", userId: "owner" });
    folderRepo.share("collab", folder.value.id);
    pageRepo.shareFolder("collab", folder.value.id);

    const createPage = new CreateBrainPage(pageRepo, folderRepo, eventBus);
    const listPages = new ListBrainPages(pageRepo);
    const created = await createPage.execute({
      title: "Runbook",
      userId: "collab",
      folderId: folder.value.id,
      contentJson: { type: "doc", blocks: [] },
    });

    expect(created.isOk).toBe(true);
    await expect(pageRepo.findById(created.value.id, "owner")).resolves.not.toBeNull();

    const storedPage = await pageRepo.findById(created.value.id, "collab");
    expect(storedPage?.userId).toBe("owner");

    const listed = await listPages.execute("collab");
    expect(listed.isOk).toBe(true);
    expect(listed.value.map((page) => page.title)).toContain("Runbook");
  });
});
