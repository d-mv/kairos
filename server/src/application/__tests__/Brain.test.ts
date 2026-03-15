import { beforeEach, describe, expect, it } from "vitest";
import { CreateBrainFolder } from "../brain/CreateBrainFolder.js";
import { CreateBrainPage } from "../brain/CreateBrainPage.js";
import { ListBrainFolders } from "../brain/ListBrainFolders.js";
import { ListBrainPages } from "../brain/ListBrainPages.js";
import { UpdateBrainPage } from "../brain/UpdateBrainPage.js";
import {
  InMemoryBrainFolderRepository,
  InMemoryBrainPageRepository,
  SpyEventBus,
} from "./mocks.js";

describe("Brain use cases", () => {
  let folderRepo: InMemoryBrainFolderRepository;
  let pageRepo: InMemoryBrainPageRepository;
  let eventBus: SpyEventBus;

  beforeEach(() => {
    folderRepo = new InMemoryBrainFolderRepository();
    pageRepo = new InMemoryBrainPageRepository();
    eventBus = new SpyEventBus();
  });

  it("creates and lists folders", async () => {
    const createFolder = new CreateBrainFolder(folderRepo, eventBus);
    const listFolders = new ListBrainFolders(folderRepo);

    const created = await createFolder.execute({ name: "Knowledge", userId: "u1" });
    expect(created.isOk).toBe(true);

    const listed = await listFolders.execute("u1");
    expect(listed.isOk).toBe(true);
    expect(listed.value).toHaveLength(1);
    expect(listed.value[0]?.name).toBe("Knowledge");
  });

  it("creates and updates pages", async () => {
    const createFolder = new CreateBrainFolder(folderRepo, eventBus);
    const folder = await createFolder.execute({ name: "Knowledge", userId: "u1" });
    const createPage = new CreateBrainPage(pageRepo, folderRepo, eventBus);
    const listPages = new ListBrainPages(pageRepo);
    const updatePage = new UpdateBrainPage(pageRepo, folderRepo, eventBus);

    const created = await createPage.execute({
      title: "System design",
      userId: "u1",
      folderId: folder.value.id,
      contentJson: { type: "doc", blocks: [] },
    });
    expect(created.isOk).toBe(true);

    const updated = await updatePage.execute({
      id: created.value.id,
      userId: "u1",
      title: "System design v2",
      contentJson: { type: "doc", blocks: [{ type: "text", text: "hello" }] },
    });
    expect(updated.isOk).toBe(true);
    expect(updated.value.title).toBe("System design v2");

    const listed = await listPages.execute("u1");
    expect(listed.isOk).toBe(true);
    expect(listed.value[0]?.folderId).toBe(folder.value.id);
  });
});
