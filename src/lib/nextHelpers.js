const { getAllPosts } = require('./getAllPosts');
const { getPostBySlug } = require('./getPostBySlug');

/**
 * Provides static props for a post page using slug
 */
const getStaticPropsForPost = async ({ params }) => {
  const post = await getPostBySlug(params.slug);

  return {
    props: {
      post
    }
  };
};

/**
 * Provides static paths for all blog posts
 */
const getStaticPathsForPosts = async () => {
  const posts = await getAllPosts();

  const paths = posts.map((post) => ({
    params: { slug: post.slug }
  }));

  return {
    paths,
    fallback: false,
  };
};

module.exports = {
  getStaticPropsForPost,
  getStaticPathsForPosts
};
