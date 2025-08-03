const { getAllPosts } = require('./lib/getAllPosts');
const { getPostBySlug } = require('./lib/getPostBySlug');
const { getStaticPropsForPost, getStaticPathsForPosts } = require('./lib/nextHelpers');

module.exports = {
    getAllPosts,
    getPostBySlug,
    getStaticPropsForPost,
    getStaticPathsForPosts,
    NotionRenderer: require('./components/NotionRenderer').default
}