const convertStatusToLabel = (status) => {
    switch (status) {
        case "scheduled":
            return "Terjadwal";
        case "ongoing":
            return "Berjalan";
        case "paused":
            return "Nonaktif";
        case "ended":
            return "Berakhir";
        default:
            return "Tidak Diketahui";
    }
};

export default convertStatusToLabel;
