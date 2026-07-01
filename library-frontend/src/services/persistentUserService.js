const LOGIN_LOCAL_STORAGE_KEY = "bookAppUser";

const getToken = () => {
  const token = window.localStorage.getItem(LOGIN_LOCAL_STORAGE_KEY);
  return token || null;
};

const saveToken = (token) => {
  window.localStorage.setItem(LOGIN_LOCAL_STORAGE_KEY, token);
};

const removeToken = () => {
  window.localStorage.removeItem(LOGIN_LOCAL_STORAGE_KEY);
};

export default { getToken, saveToken, removeToken };
