import React from 'react';
import {
  Comment,
  USER_COMMENTS_QUERY,
  UserCommentsData,
} from '../graphql/comments';
import ProfilePage from '../pages/[userId]/index';
import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import AuthContext from '../components/AuthContext';
import { PublicProfile } from '../lib/user';
import { MockedGraphQLResponse, mockGraphQL } from './helpers/graphql';
import nock from 'nock';
import { Connection } from '../graphql/common';
import { AUTHOR_FEED_QUERY, AuthorFeedData, Post } from '../graphql/posts';
import { USER_STATS_QUERY, UserStats, UserStatsData } from '../graphql/users';

beforeEach(() => {
  nock.cleanAll();
  jest.clearAllMocks();
});

const defaultCommentsPage: Connection<Comment> = {
  pageInfo: {
    hasNextPage: true,
    endCursor: '',
  },
  edges: [
    {
      node: {
        permalink: 'https://daily.dev/c1',
        createdAt: '2020-07-26T13:04:35.000Z',
        content: 'My comment',
        numUpvotes: 50,
        id: 'c1',
      },
    },
  ],
};

const createCommentsMock = (
  page = defaultCommentsPage,
): MockedGraphQLResponse<UserCommentsData> => ({
  request: {
    query: USER_COMMENTS_QUERY,
    variables: {
      userId: 'u2',
      first: 3,
    },
  },
  result: {
    data: {
      page,
    },
  },
});

const defaultFeedPage: Connection<Post> = {
  pageInfo: {
    hasNextPage: true,
    endCursor: '',
  },
  edges: [
    {
      node: {
        id: '0e4005b2d3cf191f8c44c2718a457a1e',
        title: 'Learn SQL',
        image:
          'https://res.cloudinary.com/daily-now/image/upload/f_auto,q_auto/v1/posts/22fc3ac5cc3fedf281b6e4b46e8c0ba2',
        source: {
          name: 'Towards Data Science',
          image:
            'https://res.cloudinary.com/daily-now/image/upload/t_logo,f_auto/v1/logos/tds',
        },
        commentsPermalink: 'https://localhost:5002/posts/9CuRpr5NiEY5',
        numUpvotes: 60,
        numComments: 5,
        views: 1234,
      },
    },
  ],
};

const createFeedMock = (
  page = defaultFeedPage,
): MockedGraphQLResponse<AuthorFeedData> => ({
  request: {
    query: AUTHOR_FEED_QUERY,
    variables: {
      userId: 'u2',
      first: 3,
    },
  },
  result: {
    data: {
      page,
    },
  },
});

const defaultStats: UserStats = {
  numPosts: 123,
  numComments: 52,
  numPostUpvotes: null,
  numPostViews: null,
  numCommentUpvotes: null,
};

const createUserStatsMock = (
  stats = defaultStats,
): MockedGraphQLResponse<UserStatsData> => ({
  request: {
    query: USER_STATS_QUERY,
    variables: {
      id: 'u2',
    },
  },
  result: {
    data: {
      userStats: stats,
    },
  },
});

const defaultProfile: PublicProfile = {
  id: 'u2',
  name: 'Daily Dev',
  username: 'dailydotdev',
  premium: false,
  reputation: 20,
  image: 'https://daily.dev/daily.png',
  bio: 'The best company!',
  createdAt: '2020-08-26T13:04:35.000Z',
  twitter: 'dailydotdev',
  github: 'dailydotdev',
  portfolio: 'https://daily.dev',
};

const renderComponent = (
  mocks: MockedGraphQLResponse[] = [
    createCommentsMock(),
    createFeedMock(),
    createUserStatsMock(),
  ],
  profile: Partial<PublicProfile> = {},
): RenderResult => {
  mocks.forEach(mockGraphQL);
  return render(
    <AuthContext.Provider
      value={{
        user: null,
        shouldShowLogin: false,
        showLogin: jest.fn(),
        logout: jest.fn(),
        updateUser: jest.fn(),
      }}
    >
      <ProfilePage profile={{ ...defaultProfile, ...profile }} />
    </AuthContext.Provider>,
  );
};

it('should show overall post views', async () => {
  renderComponent([
    createCommentsMock(),
    createFeedMock(),
    createUserStatsMock({
      numPosts: 123,
      numComments: 52,
      numPostUpvotes: 2,
      numPostViews: 1789,
      numCommentUpvotes: 999,
    }),
  ]);
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('1,789');
  expect(el).toBeInTheDocument();
});

it('should show overall upvotes', async () => {
  renderComponent([
    createCommentsMock(),
    createFeedMock(),
    createUserStatsMock({
      numPosts: 123,
      numComments: 52,
      numPostUpvotes: 2,
      numPostViews: 1789,
      numCommentUpvotes: 999,
    }),
  ]);
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('1,001');
  expect(el).toBeInTheDocument();
});

it('should show the number of upvotes per comment', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('50');
  expect(el).toBeInTheDocument();
});

it('should format creation time of comment', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('Jul 26, 2020');
  expect(el).toBeInTheDocument();
});

it('should add link to the comment', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByLabelText('My comment');
  expect(el).toHaveAttribute('href', 'https://daily.dev/c1');
});

it('should show empty screen when no comments', async () => {
  renderComponent([
    createCommentsMock({
      pageInfo: {
        hasNextPage: true,
        endCursor: '',
      },
      edges: [],
    }),
  ]);
  await waitFor(() => nock.isDone());
  const el = await screen.findByTestId('emptyComments');
  expect(el).toBeInTheDocument();
});

it('should show the number of upvotes per post', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('50');
  expect(el).toBeInTheDocument();
});

it('should show the number of comments per post', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('5');
  expect(el).toBeInTheDocument();
});

it('should show the number of views per post', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('1.2K');
  expect(el).toBeInTheDocument();
});

it('should add link to the post', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByLabelText('Learn SQL');
  expect(el).toHaveAttribute(
    'href',
    'https://localhost:5002/posts/9CuRpr5NiEY5',
  );
});

it('should show empty screen when no posts', async () => {
  renderComponent([
    createCommentsMock(),
    createFeedMock({
      pageInfo: {
        hasNextPage: true,
        endCursor: '',
      },
      edges: [],
    }),
  ]);
  await waitFor(() => nock.isDone());
  const el = await screen.findByTestId('emptyPosts');
  expect(el).toBeInTheDocument();
});

it('should show the total number of posts', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('(123)');
  expect(el).toBeInTheDocument();
});

it('should show the total number of comments', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = await screen.findByText('(52)');
  expect(el).toBeInTheDocument();
});

it('should not show overall stats when not available', async () => {
  renderComponent();
  await waitFor(() => nock.isDone());
  const el = screen.queryByText('Article views');
  expect(el).toBeNull();
});
