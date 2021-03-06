import React, { useState, useEffect, useReducer } from 'react';
import { getCall, patchCall } from '../../utils/Network';
import { Loader } from '../../components/Loader/Loader';

import './Profile.css';
import { BigProfileCard } from '../../components/ProfileCard/BigProfileCard';
import { getUserInformation } from '../../utils/Utils';
import { ProfilePosts } from '../../components/ProfilePosts/ProfilePosts';

const GET_USER_API = '/users';
const GET_POSTS_API = '/posts';
const POST_FOLLOW_API = '/users/follow';

const POST_UNFOLLOW_API = '/users/unfollow';

const initialState = {};

const updateFollowing = (following, loggedIn) => {
  const index = following.indexOf(loggedIn);
  if (index !== -1) {
    following.splice(index, 1);
  } else {
    following.push(loggedIn);
  }
  return following;
};

const postsReducer = (state = [], action) => {
  const { type } = action;
  switch (type) {
    case 'set_posts':
      return [...action.posts];
    default:
      return state;
  }
};

const reducer = (state = initialState, action) => {
  const { type, ...rest } = action;
  debugger;
  switch (type) {
    case 'set_user':
      return {
        ...rest,
      };
    case 'update_followers':
      return {
        ...state,
        followers: updateFollowing(state.followers, rest.loggedIn),
      };
    default:
      return state;
  }
};

const isFollowing = (state, username) => {
  if (state && state.followers) {
    return state.followers.indexOf(username) !== -1;
  }
  return false;
};

export const Profile = ({ ...props }) => {
  const username = props.match.params.username;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const [state, dispatch] = useReducer(reducer, initialState);
  const [posts, dispatchPosts] = useReducer(postsReducer, []);

  let information = getUserInformation();

  useEffect(() => {
    const getUser = async (username) => {
      setLoading(true);
      try {
        const response = await getCall(`${GET_USER_API}/${username}`);
        const users = await response.json();
        debugger;
        const action = { type: 'set_user', ...users[0] };
        dispatch(action);
        setLoading(false);
        setError(false);
      } catch (err) {
        setLoading(false);
        setError(true);
      }
    };

    const getPosts = async (username) => {
      setLoading(true);
      try {
        const response = await getCall(`${GET_POSTS_API}/user/${username}`);
        const postsArray = await response.json();
        const action = { type: 'set_posts', posts: postsArray };
        dispatchPosts(action);
        setLoading(false);
      } catch (err) {
        setLoading(false);
        setError(true);
      }
    };

    getPosts(username);
    getUser(username);
  }, [username]);

  const handleFollowClick = async () => {
    debugger;
    let url = POST_FOLLOW_API;
    if (isFollowing(state, information.userName)) {
      url = POST_UNFOLLOW_API;
    }
    url += `/${username}`;
    debugger;
    try {
      await patchCall(
        url,
        JSON.stringify({
          loggedIn: information.userName,
        })
      );
      debugger;
      updateFollowing([...state.followers], information.userName);
      dispatch({
        type: 'update_followers',
        loggedIn: information.userName,
        username,
      });
    } catch (err) {
      console.log('Do something with the error');
    }
  };

  return (
    <div className="profile-view ins-body">
      {loading && <Loader />}
      {error && <span>No profile exists with the username {username}</span>}
      {!loading && !error && (
        <BigProfileCard
          userName={username}
          description={username}
          name={state ? state.name : ''}
          showFollowing={
            state.userName && information
              ? state.userName !== information?.userName
              : false
          }
          isFollowing={isFollowing(state, information?.userName)}
          postsCount={posts.length}
          followersCount={state.followers ? state.followers.length : 0}
          followingCount={state.following ? state.following.length : 0}
          handleFollowClick={() => {
            handleFollowClick();
          }}
        />
      )}
      {posts.length !== 0 && <ProfilePosts posts={posts} />}
      {posts.length === 0 && !loading && <span>No posts to show</span>}
    </div>
  );
};
