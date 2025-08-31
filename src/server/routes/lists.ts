import express from "express";
import { AddListCommandHandler } from "../cqrs/lists/commands/addListCommand";
import { optionalAuth, requireAuth } from "../auth/middleware";
import { GetListsForUserQueryHandler } from "../cqrs/lists/queries/getListsForUserQuery";
import { unauthorizedResponse, serverErrorResponse } from "../../shared/util/apiErrorHandler";
import { AddFilmToListCommandHandler } from "../cqrs/lists/commands/addFilmToListCommand";
import { GetListByIDQueryHandler } from "../cqrs/lists/queries/getListByIDQuery";
import { RemoveFilmFromListCommandHandler } from "../cqrs/lists/commands/removeFilmFromListCommand";
import { GetListBySlugQueryHandler } from "../cqrs/lists/queries/getListBySlugQueryHandler";
import { DoesSlugExistQueryHandler } from "../cqrs/lists/queries/doesSlugExistQuery";

const router = express.Router();

router.post("/create", requireAuth, async (req, res) =>
{
    try
    {
        if (!req.user)
        {
            return res.status(401).json(unauthorizedResponse());
        }

        const result = await new AddListCommandHandler().handle({
            name: req.body.name,
            privacy: req.body.privacy,
            film: req.body.film,
            userId: req.user.id,
            description: req.body.description
        });

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.status(201).json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to create list"));
    }
});

router.get("/my-lists", requireAuth, async (req, res) =>
{
    try
    {
        if (!req.user)
        {
            return res.status(401).json(unauthorizedResponse());
        }

        const result = await new GetListsForUserQueryHandler().handle({
            userId: req.user.id
        });

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to get lists"));
    }
});

router.get("/get-list/:listId", optionalAuth, async (req, res) =>
{
    try
    {
        const result = await new GetListByIDQueryHandler().handle({
            userId: req.user?.id,
            listId: parseInt(req.params.listId)
        });

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to get list"));
    }
});

router.get("/view/:slug", async (req, res) =>
{
    try
    {
        const slug = req.params.slug;
        // You need a query handler to fetch by slug
        const result = await new GetListBySlugQueryHandler().handle({ slug });

        if (!result.success)
        {
            return res.status(404).json(result);
        }

        // Only allow if list is public or unlisted
        const list = result.data?.list;
        if (list.privacyType !== 0 && list.privacyType !== 1) // 0: public, 1: unlisted
        {
            return res.status(403).json({ success: false, error: "List is private" });
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to get list by slug"));
    }
});

router.get("/does-slug-exist/:slug", async (req, res) =>
{
    try
    {
        const slug = req.params.slug;
        // You need a query handler to fetch by slug
        const result = await new DoesSlugExistQueryHandler().handle({ slug });

        if (!result.success)
        {
            return res.status(404).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to check if a list with this slug exists"));
    }
});

router.put("/add-to-list", requireAuth, async (req, res) =>
{
    try
    {
        if (!req.user)
        {
            return res.status(401).json(unauthorizedResponse());
        }

        const result = await new AddFilmToListCommandHandler().handle({
            film: req.body.film,
            listId: req.body.listId
        });

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to add film to list"));
    }
});

router.delete("/remove-from-list", requireAuth, async (req, res) =>
{
    try
    {
        if (!req.user)
        {
            return res.status(401).json(unauthorizedResponse());
        }

        const result = await new RemoveFilmFromListCommandHandler().handle({
            filmId: req.body.filmId,
            listId: req.body.listId
        });

        if (!result.success)
        {
            return res.status(400).json(result);
        }

        return res.json(result);
    } catch (err)
    {
        res.status(500).json(serverErrorResponse("Failed to remove film from list"));
    }
});

export default router;