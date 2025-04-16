import Joi from "joi";
import * as recipeService from "../Services/recipeService.js";

export const getRecipe = async (req, res) => {
    const { recipeId } = req.params;

    if (!recipeId) {
        return res.status(400).json({ message: "Recipe ID is required" });
    }

    try {
        const recipe = await recipeService.getRecipe({ recipeId });

        if (recipe.success) {
            return res.status(200).json(recipe);
        } else {
            return res.status(404).json({ message: recipe.message });
        }
    } catch (error) {
        console.error("Error fetching recipe:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

export const createRecipe = async (req, res) => {
    //FIXME
    const recipeSchema = Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        review_id: Joi.string().optional(),
        ingredients: Joi.array().items(
            Joi.object({
                category: Joi.string().optional(),
                name: Joi.string().required(),
                amount: Joi.string().required()
            })
        ).optional(),

        instructions: Joi.array().items(Joi.string()).optional(),
        pictures: Joi.array().items(
            Joi.object({
                //name: Joi.string().required(),
                link: Joi.string().pattern(/^https?:\/\/.+/).required()
            })
        ).optional(),
        rating: Joi.number().min(1).max(5).optional(),
        macros: Joi.object({
            calories: Joi.number().optional(),
            protein: Joi.number().optional(),
            carbs: Joi.number().optional(),
            fat: Joi.number().optional()
        }).optional()
    });

    const { error, value } = recipeSchema.validate(req.body);
    if (error) {
        const messages = error.details.map(detail => detail.message.replace(/"/g, ''));
        return res.status(400).json({ message: messages });
    }

    const recipeObj = {
        ...value,
        dateCreated: new Date().toISOString()
    };

    try {
        console.log("Saving recipe:", recipeObj);
        const newRecipe = await recipeService.createRecipe(recipeObj);

        if (!newRecipe) {
            console.error("Database insertion failed:", recipeObj);
            return res.status(500).json({ success: false, message: "Failed to create recipe in database" });
        }

        console.log("Recipe saved successfully:", newRecipe);
        return res.status(201).json({ success: true, message: "Recipe created successfully", recipe: newRecipe });
    } catch (error) {
        console.error("Error creating recipe:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export const getSavedRecipes = async (req, res) => {
    try {
        const { userId } = req.user;
        const responses = await recipeService.getSavedRecipes(userId);

        if (responses.success) {
            return res.status(200).json({ success: true, recipes: responses.recipes });
        } else {
            return res.status(400).json({ success: false, message: responses.message });
        }
    } catch (error) {
        console.error("Error fetching saved recipes:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

export async function updateRecipe(req, res) {
    const { recipe } = req.body;

    try {
        // Call the updateRecipe service function with the received recipe data
        const updatedRecipe = await recipeService.updateRecipe(recipe);
        if (updatedRecipe) {
            res.status(200).json({
                success: true,
                message: 'Recipe updated successfully',
                recipe: updatedRecipe
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Recipe not found or error updating'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error updating recipe: ${error.message}`
        });
    }
}

export const getRecipes = async (req, res) => {
    const { cuisine, category } = req.query;

    const recipesList = await recipeService.getRecipes(cuisine, category)

    if (recipesList.success) {
        res.status(200).json({ recipes: recipesList.recipes })
    } else {
        res.status(500).json({ message: "Failed to fetch recipes" })
    }
}

export const getAllRecipes = async (req, res) => {
    try {
        const recipes = await recipeService.getAllRecipes();

        if (recipes.success) {
            return res.status(200).json({ success: true, recipes: recipes.recipes });
        } else {
            return res.status(404).json({ success: false, message: recipes.message });
        }
    } catch (error) {
        console.error("Error fetching all recipes:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
}

export const deleteSavedRecipe = async (req, res) => {
    const { recipeId } = req.params;
    const { userId } = req.user;

    if (!recipeId) {
        return res.status(400).json({ success: false, message: "Recipe ID is required" });
    }

    try {
        const result = await recipeService.deleteSavedRecipe(userId, recipeId);

        if (result.success) {
            return res.status(200).json({ success: true, message: "Recipe deleted successfully" });
        } else {
            return res.status(404).json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error("Error deleting saved recipe:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};