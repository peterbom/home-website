import moment from "moment";

export class DateTimeFormatValueConverter {
    toView(value) {
        if (!value) {
            return null;
        }

        return moment(value).format("YYYY-MM-DD HH:mm:ss");
    }

    fromView(value) {
        if (!value) {
            return null;
        }

        return moment(value, "YYYY-MM-DD HH:mm:ss").toDate();
    }
}