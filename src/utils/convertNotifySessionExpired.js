import moment from "moment";

const convertNotifySessionExpired = (time_createdAt) => {
    if (!time_createdAt || !moment(time_createdAt).isValid()) {
        return {
            type: "urgent",
            text: "Never logged in"
        };
    }

    const daysSinceCreated = moment().diff(moment(time_createdAt), "days");

    if (daysSinceCreated > 10) {
        return {
            type: "urgent",
            text: "Session inactive, login again"
        };
    }

    return {
        type: "info",
        text: "Session active"
    };
};

export default convertNotifySessionExpired;