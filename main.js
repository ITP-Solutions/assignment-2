// Post partial
const postTemplate = Handlebars.registerPartial(
  "post",
  $("#post-template").html()
);

// Posts template
const postsTemplate = Handlebars.compile($("#posts-template").html());

// Details template
const detailsTemplate = Handlebars.compile($("#details-template").html());

/**
 * Gets list of posts from reddit api
 * @param subreddit - subreddit to retrieve post data for
 * @return promise eventually containing results
 */
function fetchPosts(subreddit) {
  return $.ajax({
    type: "GET",
    url: `https://www.reddit.com/r/${subreddit}.json`
  });
}

/**
 * Fetches info about subreddit from given subreddit id
 * @param subredditId - the id of the subreddit
 * @return promise eventually containing results
 */
function fetchInfo(subredditId) {
  return $.ajax({
    type: "GET",
    url: `https://www.reddit.com/api/info.json?id=${subredditId}`
  });
}

/**
 * Extracts proper posts data in correct format for Handlebars
 * to consume
 * @param results - the raw json results from api call
 * @return posts data in format for frontend
 */
function extractPostsData(results) {
  return results.data.children.map(({ data })=> ({
    ...data,
    subreddit_subscribers: data.subreddit_subscribers.toLocaleString(),
    are_comments: data.num_comments > 0,
    num_comments: data.num_comments.toLocaleString()
  }));
}

/**
 * Extracts info data from subreddit info response
 * @param results - raw json response from info endpoint
 * @return json data in form consumable by handlebars
 */
function extractInfoData(results) {
  if (results.data.children.length < 1) {
    throw new Exception("No data present in info response");
  }
  return results.data.children[0].data;
}

/**
 * Extracts subreddit_id from posts response
 * @param results - raw json from posts response 
 * @return subreddit_id
 */
function extractSubredditId(results) {
  if (results.data.children.length < 1) {
    throw new Exception("No posts found to get subreddit_id from");
  } 
  return results.data.children[0].data.subreddit_id;
}

/**
 * Gets user info about desired subreddit
 * @return string containing users' desired subreddit 
 */
function getSubredditInput() {
  return _getInputNode().value;
}

/**
 * Checks subreddit input to make sure not empty
 * @return true if non empty input, false otherwise
 */
function checkSubredditInput() {
  return _getInputNode().value !== "";
}

/**
 * Gets input node from DOM
 * @return input dom node
 */
function _getInputNode() {
  return document.querySelector("#subreddit-input");
}

/**
 * Triggers loading indicator
 * @param show - whether or not to show indicator
 */
function triggerLoading(show=true) {
  document.querySelector("#loading-details").hidden = !show;
}

/**
 * Triggers displaying results on page
 * @param show - whether or not to show results
 */
function triggerDisplayResults(show=true) {
  document.querySelector("#details").hidden = !show;
  document.querySelector("#results").hidden = !show;
}

/**
 * Triggers error message
 * @param show - whether or not to show error
 */
function triggerError(show=true) {
  document.querySelector("#error-message").hidden = !show; 
}

/**
 * Handles form submission.
 *
 * 1. Remove the current results
 * 2. Trigger the loading icon
 * 3. Make sure input is not empty
 * 4. Fetch data from posts endpoint
 * 5. Render posts into handlebars template
 * 6. Fetch info from subreddit info endpoint
 * 7. Render info into handlebars template
 * 8. Turn off loading spinner
 * 9. Make results visible
 * 
 * @param event - event object from form submission
 */
function handleSubmit(event) {
  event.preventDefault();
  triggerDisplayResults(false);
  triggerError(false);
  triggerLoading();
  if (!checkSubredditInput()) return;
  fetchPosts(getSubredditInput())
    .then((results) => {
      $("#results").html(postsTemplate({
        posts: extractPostsData(results)
      }));
      return fetchInfo(extractSubredditId(results));
    })
    .then((results) => {
      $("#details").html(detailsTemplate({
        details: extractInfoData(results)
      }));
      triggerLoading(false);
      triggerDisplayResults();
    })
    .catch(error => {
      triggerLoading(false);
      triggerError(true);
      console.error(error);
    });
}

document.querySelector("#enter-subreddit").addEventListener("submit", handleSubmit);
