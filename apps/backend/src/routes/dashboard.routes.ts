import { Router } from "express";
import { dashboardService } from "../services/dashboard.service";
import { HttpError } from "../middleware/error-handler";

function getUserId(req: Express.Request): string {
  const userId = (req as any).auth?.user?.id;
  if (!userId) throw new HttpError(401, "unauthorized", "Authentication required");
  return userId;
}

export const dashboardRouter = Router();

dashboardRouter.get("/", async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const person_id = typeof req.query.person_id === "string" ? req.query.person_id : undefined;
    const data = await dashboardService.getDashboard(userId, person_id);
    res.json({ data });
  } catch (error) {
    next(error);
  }
});
