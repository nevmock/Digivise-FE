import moment from "moment";

const convertNotifySessionExpired = (time_createdAt) => {
    const daysSinceCreated = moment().diff(moment(time_createdAt), "days");

    if (time_createdAt == null || time_createdAt === undefined || isNaN(time_createdAt)) {
        return {
            type: "urgent",
            text: "Never logged in"
        };
    } else if (daysSinceCreated >= 25) {
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