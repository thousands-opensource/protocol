import * as Yup from "yup";

interface BaseSeriesFields {
    serverCode: string;
    seriesName: string;
    imageUrl: string;
    backgroundImageUrl: string;
    seriesDescription: string;
    seriesId: string;
    seriesPointConfiguration?: string;
}

export interface SeriesFormValues extends BaseSeriesFields {
    startDate: Date; // Date object
    endDate: Date; // Date object
}
export interface SeriesCardProps extends BaseSeriesFields {
    startDate: number; // timestamp
    endDate: number; // timestamp
}

export type CreateSeriesFormValues = Omit<SeriesFormValues, "seriesId">;
export type CreateSeriesCardProps = Omit<SeriesCardProps, "seriesId">;

export const seriesValidationSchema = Yup.object().shape({
    seriesName: Yup.string().required("Series name is required"),
    startDate: Yup.date().required("Start date is required"),
    endDate: Yup.date().required("End date is required"),
    imageUrl: Yup.string().required("Image URL is required"),
    backgroundImageUrl: Yup.string().required(
        "Background image URL is required"
    ),
    seriesDescription: Yup.string().required("Description is required"),
    seriesPointConfiguration: Yup.string().test(
        "is-json",
        "Invalid JSON format",
        (value) => {
            if (!value) return true; // not required
            try {
                JSON.parse(value);
                return true;
            } catch (error) {
                return false;
            }
        }
    ),
});
