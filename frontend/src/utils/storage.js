import api from "./api";

export async function uploadFileToR2(file, folder = "uploads") {
  const { data } = await api.post("/uploads/presign", {
    mimeType: file.type,
    folder,
  });

  await fetch(data.uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });

  return data.objectUrl || "";
}
