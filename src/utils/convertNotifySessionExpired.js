import moment from "moment";

const convertNotifySessionExpired = (time_createdAt) => {
    const daysSinceCreated = moment().diff(moment(time_createdAt), "days");

    if (daysSinceCreated >= 25) {
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