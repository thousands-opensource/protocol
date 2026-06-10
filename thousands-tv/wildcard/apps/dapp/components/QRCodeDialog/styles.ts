import { hexToRgba } from "@/utils/util";

const modalContentSx = { padding: "20px 12px 20px" };
const modalHeaderSx = { paddingBottom: 0, fontSize: "2xl" };
const modalCloseButtonSx = {
    color: hexToRgba("#000000", 0.502),
    top: "var(--chakra-space-6)",
};
const modalSubTextSx = { fontSize: "md", color: hexToRgba("#000000", 0.502) };
const qrCodeWrapperSx = {
    display: "flex",
    justifyContent: "center",
    marginTop: 12,
    marginBottom: 12,
};
const phoneLinkWrapperSx = {
    display: "flex",
    justifyContent: "center",
};

const phoneButtonSx = {
    display: "flex",
    alignItems: "center",
    fontWeight: 500,
    margin: "16px 0 8px",
};
const phoneTextSx = { marginLeft: 9, color: "#7c65c1" };

export {
    modalContentSx,
    modalHeaderSx,
    modalCloseButtonSx,
    modalSubTextSx,
    qrCodeWrapperSx,
    phoneLinkWrapperSx,
    phoneButtonSx,
    phoneTextSx,
};
