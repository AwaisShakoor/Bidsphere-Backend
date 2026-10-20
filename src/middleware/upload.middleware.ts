import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
});

export const uploadItemImages = upload.array("images", 5);