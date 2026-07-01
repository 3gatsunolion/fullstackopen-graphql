import { useNotification } from "../hooks/useNotification";

const Notification = () => {
  const { message, isError } = useNotification();

  if (!message) {
    return null;
  }

  return <div style={{ color: isError ? "red" : "green" }}>{message}</div>;
};

export default Notification;
