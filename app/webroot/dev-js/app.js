goog.provide("panoptikos.Panoptikos");

goog.require("panoptikos.config.core");
goog.require("panoptikos.ui.Board");
goog.require("panoptikos.ui.BoardControls");
goog.require("panoptikos.ui.SubredditPicker");
goog.require("panoptikos.ui.SubredditPickerLauncher");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.events.EventType");

/**
 * @constructor
 */
panoptikos.Panoptikos = function() {
	this.setSubreddits_();
	this.createUi_();
};
goog.exportSymbol("p", panoptikos.Panoptikos);

/**
 * setSubreddits_ determines what subreddits to use. If the user selected
 * subreddits, they are used, otherwise the default subreddits are used.
 * @private
 */
panoptikos.Panoptikos.prototype.setSubreddits_ = function() {
	var subreddits = panoptikos.models.subreddit.readSubredditsFromLocationHash();

	if (!subreddits.length) {
		subreddits = panoptikos.models.subreddit.getDefaultSubreddits();
	}

	panoptikos.models.subreddit.setSelectedSubreddits(subreddits);
};

/**
 * @private
 */
panoptikos.Panoptikos.prototype.createUi_ = function() {
	var subredditPickerLauncherElement = new panoptikos.ui.SubredditPickerLauncher().createDom();
	goog.dom.appendChild(document.body, subredditPickerLauncherElement);

	goog.events.listen(
		subredditPickerLauncherElement,
		goog.events.EventType.CLICK,
		this.openSubredditPicker_,
		false,
		this
	);

	this.board = new panoptikos.ui.Board(
		panoptikos.config.core.board.columnMaxWidth,
		panoptikos.config.core.board.columnMarginLeft,
		panoptikos.config.core.reddit.maxThreadsPerRequest
	);
	goog.dom.appendChild(document.body, this.board.getElement());
	this.board.rebuild();

	this.boardControls = new panoptikos.ui.BoardControls();

	goog.events.listen(
		this.board,
		panoptikos.ui.Board.EventType.DID_COMPLETE_REQUEST,
		this.boardControls.updateLoadMoreButtonText,
		false,
		this.boardControls
	);

	goog.events.listen(
		this.boardControls,
		panoptikos.ui.BoardControls.EventType.USER_DID_ASK_FOR_IMAGES,
		this.board.retrieveThreadsFromReddit,
		false,
		this.board
	);

	var boardControlsElement = this.boardControls.createDom();
	goog.dom.appendChild(document.body, boardControlsElement);

	// Load images
	this.boardControls.dispatchEvent(
		panoptikos.ui.BoardControls.EventType.USER_DID_ASK_FOR_IMAGES
	);

	// Autoload images if page end is reached
	goog.events.listen(
		window,
		goog.events.EventType.SCROLL,
		this.appendImages_,
		false,
		this
	);
};

/**
 * @private
 */
panoptikos.Panoptikos.prototype.appendImages_ = function(event) {
	if (window.scrollY + window.innerHeight + 500 >= document.body.scrollHeight) {
		this.boardControls.dispatchEvent(
			panoptikos.ui.BoardControls.EventType.USER_DID_ASK_FOR_IMAGES
		);
	}
};

/**
 * @private
 */
panoptikos.Panoptikos.prototype.openSubredditPicker_ = function(event) {
	event.preventDefault();
	var subredditPicker = new panoptikos.ui.SubredditPicker();

	goog.events.listen(
		subredditPicker,
		panoptikos.ui.SubredditPicker.EventType.USER_DID_CHANGE_SELECTED_SUBREDDITS,
		this.board.handleUserDidChangeSelectedSubredditsEvent,
		false,
		this.board
	);

	subredditPicker.open();
};
