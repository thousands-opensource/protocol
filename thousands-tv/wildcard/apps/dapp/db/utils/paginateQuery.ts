import { Model, Document } from "mongoose";

interface PaginationResult<T> {
    data: T[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
}

/**
 * Paginates a query on a Mongoose model.
 *
 * @template T - The type of the document.
 * @param {Model<T>} model - The Mongoose model to paginate.
 * @param {object} query - The query object to filter the documents.
 * @param {object} options - The pagination options.
 * @param {number} options.page - The current page number.
 * @param {number} options.limit - The number of documents per page.
 * @returns {Promise<PaginationResult<T>>} A promise that resolves to the pagination result.
 */
export async function paginateQuery<T extends Document>(
    model: Model<T>,
    query: object,
    options: { page: number; limit: number }
): Promise<PaginationResult<T>> {
    const { page, limit } = options;

    const totalItems = await model.countDocuments(query).exec();
    const totalPages = Math.ceil(totalItems / limit);
    const data = await model
        .find(query)
        .sort({ createdAt: -1 }) // Sort by createdAt in descending order
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

    return {
        data,
        totalItems,
        currentPage: page,
        totalPages,
    };
}
