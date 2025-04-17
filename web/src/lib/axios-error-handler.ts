function getAxiosErrorCode(error: any) {
  if (error.response == null) {
    return 0;
  }
  return error.response.status;
}

function getAxiosErrorMessage(error: any) {
  if (error.response == null) {
    return error.message;
  } else if (error.response.data.detail != null) {
    return error.response.data.detail;
  } else {
    return "Failed with status code " + error.response.status;
  }
}

export { getAxiosErrorCode, getAxiosErrorMessage };
