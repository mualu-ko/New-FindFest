// src/services/followService.js
import api from "../utils/axios";

export const followUser = (currentUid, targetUid) => {
  return api.post(`/api/follow/follow/${currentUid}/${targetUid}`);
};

export const unfollowUser = (currentUid, targetUid) => {
  return api.post(`/api/follow/unfollow/${currentUid}/${targetUid}`);
};

export const checkIfFollowing = (currentUid, targetUid) => {
  return api.get(`/api/follow/status/${currentUid}/${targetUid}`);
};

export const getFollowers = (uid) => {
  return api.get(`/api/follow/followers/${uid}`);
};

export const getFollowing = (uid) => {
  return api.get(`/api/follow/following/${uid}`);
};
