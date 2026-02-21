import { Router } from "express";

export const publicRouter = Router();

publicRouter.get("/ping", (req, res) => {
  res.status(200).json({
    ok: true,
    requestId: req.requestId,
  });
});
