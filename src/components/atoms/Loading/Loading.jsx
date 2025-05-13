import "../Loading/Loading.css";

const Loading = ({ size = 50 }) => {
    return (
        <div
            className="loader"
            style={{ width: size, height: size }}
        />
    );
};

export default Loading;