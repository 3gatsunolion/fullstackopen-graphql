import { useReducer } from "react";
import {
  NotificationContext,
  NotificationDispatchContext,
} from "./NotificationContext";

export const SHOW_NOTIFICATION = "SHOW_NOTIFICATION";
export const CLEAR_NOTIFICATION = "CLEAR_NOTIFICATION";

const emptyNotification = { message: null };

function notificationReducer(state, action) {
  switch (action.type) {
    case SHOW_NOTIFICATION:
      return action.payload;
    case CLEAR_NOTIFICATION:
      return emptyNotification;
    default:
      return state;
  }
}

export const NotificationContextProvider = (props) => {
  const [notification, dispatch] = useReducer(
    notificationReducer,
    emptyNotification,
  );

  return (
    <NotificationContext.Provider value={notification}>
      <NotificationDispatchContext.Provider value={dispatch}>
        {props.children}
      </NotificationDispatchContext.Provider>
    </NotificationContext.Provider>
  );
};
