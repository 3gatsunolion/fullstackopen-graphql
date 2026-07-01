import { useContext } from "react";
import {
  SHOW_NOTIFICATION,
  CLEAR_NOTIFICATION,
} from "../contexts/NotificationProvider";
import {
  NotificationContext,
  NotificationDispatchContext,
} from "../contexts/NotificationContext";

export const useNotification = () => useContext(NotificationContext);

let timer;
export const useNotificationActions = () => {
  const dispatch = useContext(NotificationDispatchContext);

  const clearNotification = () => {
    dispatch({ type: CLEAR_NOTIFICATION });
  };

  const showNotification = (message, isError = false, seconds = 5) => {
    clearTimeout(timer);
    dispatch({
      type: SHOW_NOTIFICATION,
      payload: { message, isError },
    });
    timer = setTimeout(() => {
      clearNotification();
    }, seconds * 1000);
  };

  return { showNotification, clearNotification };
};
