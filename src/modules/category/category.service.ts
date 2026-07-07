import { prisma } from "../../lib/prisma";

const slugify = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

const createCategory = async (payload: { name: string; description?: string; slug?: string }) => {
    const slug = payload.slug ?? slugify(payload.name);

    return prisma.category.create({
        data: {
            name: payload.name,
            description: payload.description,
            slug
        }
    });
};

const getAllCategories = async () => {
    return prisma.category.findMany({
        orderBy: {
            createdAt: "desc"
        },
        include: {
            _count: {
                select: {
                    properties: true
                }
            }
        }
    });
};

const updateCategory = async (categoryId: string, payload: { name?: string; description?: string; slug?: string }) => {
    return prisma.category.update({
        where: {
            id: categoryId
        },
        data: {
            ...(payload.name ? { name: payload.name } : {}),
            ...(payload.description !== undefined ? { description: payload.description } : {}),
            ...(payload.slug ? { slug: payload.slug } : {})
        }
    });
};

const deleteCategory = async (categoryId: string) => {
    return prisma.category.delete({
        where: {
            id: categoryId
        }
    });
};

export const categoryService = {
    createCategory,
    getAllCategories,
    updateCategory,
    deleteCategory
};