<script lang="ts">
	import { onMount } from "svelte";
	import {
		threads,
		isLoading,
		error,
		currentProjectId as currentTopicId,
		loadThreads,
		postComment,
		replyToComment,
		flagSpam,
		createProfileBox,
	} from "$lib/ergo/commentStore";
	import { reputation_proof } from "$lib/ergo/store";
	import { fetchProfile } from "$lib/ergo/commentFetch";
	import { connected } from "$lib/ergo/store";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import { Label } from "$lib/components/ui/label/index.js";
	import { Textarea } from "$lib/components/ui/textarea";
	import { ThumbsUp, ThumbsDown, UserPlus, Reply, Flag } from "lucide-svelte";
	import { getScore, type Comment } from "$lib/ergo/commentObject";
	import * as jdenticon from "jdenticon";
	import { web_explorer_uri_tx } from "$lib/ergo/envs";

	// Global ergo wallet connector
	declare const ergo: any;

	export let topic_id: string;
	// Keep these props to avoid breaking parent usage if they are passed, though they might not be used in the new code directly or handled differently.
	// The new code handles profile loading internally but accepts it as a prop in the old code.
	// The user's new code doesn't have `profile` or `connect_executed` as props, but `App.svelte` passes them.
	// To avoid errors/warnings about unknown props, I should probably keep them or update App.svelte.
	// The user's code has `export let projectId: string;` and that's it.
	// I will stick to the user's code but rename `projectId` to `topic_id`.
	// If I remove `profile` and `connect_executed` props, Svelte might warn or error if they are passed.
	// `App.svelte` passes `<Forum bind:topic_id {profile} {connect_executed} />`.
	// So I should declare them to avoid "unexpected prop" warnings, even if unused, or better yet, use them if applicable.
	// The new code has `$: if ($connected ...)` logic to load profile.
	// The old code accepted `profile` as a prop.
	// I will add them back as exports to be safe and compatible.
	export let profile: any = null; // Type was ReputationProof | null
	export let connect_executed = false;

	let newCommentText = "";
	let isPostingComment = false;
	let sentiment: boolean | null = null;
	let showAllComments = false;
	let postError: string | null = null;
	let isCreatingProfile = false;

	// Reply state
	let replyingToId: string | null = null;
	let replyText = "";
	let replySentiment: boolean | null = null;
	let isPostingReply = false;

	// Spam flagging state
	let flaggingSpamId: string | null = null;

	$: hasProfile =
		$reputation_proof !== null &&
		$reputation_proof?.current_boxes?.length > 0;

	function getAvatarSvg(tokenId: string, size = 40): string {
		return jdenticon.toSvg(tokenId, size);
	}

	async function handleLoadThreads() {
		try {
			currentTopicId.set(topic_id);
			await loadThreads();
		} catch (err) {
			console.error("Error loading threads:", err);
		}
	}

	async function handleCreateProfile() {
		isCreatingProfile = true;
		postError = null;
		try {
			const txId = await createProfileBox();
		} catch (err: any) {
			console.error("Error creating profile:", err);
			postError = err?.message || "Failed to create profile";
		} finally {
			isCreatingProfile = false;
		}
	}

	async function handlePostComment() {
		if (!newCommentText.trim()) return;

		isPostingComment = true;
		postError = null;
		try {
			await postComment(newCommentText, sentiment ?? false);
			newCommentText = "";
			sentiment = null;
		} catch (err: any) {
			console.error("Error posting comment:", err);
			postError = err?.message || "Failed to post comment";
		} finally {
			isPostingComment = false;
		}
	}

	async function handleReply(commentId: string) {
		if (!replyText.trim()) return;

		isPostingReply = true;
		postError = null;
		try {
			await replyToComment(commentId, replyText, replySentiment ?? false);
			replyText = "";
			replySentiment = null;
			replyingToId = null;
		} catch (err: any) {
			console.error("Error posting reply:", err);
			postError = err?.message || "Failed to post reply";
		} finally {
			isPostingReply = false;
		}
	}

	async function handleFlagSpam(commentId: string) {
		flaggingSpamId = commentId;
		postError = null;
		try {
			await flagSpam(commentId);
		} catch (err: any) {
			console.error("Error flagging spam:", err);
			postError = err?.message || "Failed to flag spam";
		} finally {
			flaggingSpamId = null;
		}
	}

	function renderComment(comment: Comment, depth: number = 0) {
		if (comment.isSpam && !showAllComments) return null;

		const score = getScore(comment);
		const marginLeft = depth * 24;

		return {
			comment,
			depth,
			marginLeft,
			score,
		};
	}

	$: allComments = $threads.flatMap((c: Comment) => {
		const flattened: Comment[] = [];
		function flatten(comment: Comment, depth: number = 0) {
			flattened.push({ ...comment, depth });
			if (comment.replies) {
				comment.replies.forEach((reply) => flatten(reply, depth + 1));
			}
		}
		flatten(c);
		return flattened;
	});

	$: topicScore = $threads.reduce((acc, comment) => {
		return acc + getScore(comment);
	}, 0);

	// Watch for wallet connection changes and load profile
	$: if (
		$connected &&
		typeof window !== "undefined" &&
		typeof ergo !== "undefined"
	) {
		// Load profile when wallet connects
		loadUserProfile();
	}

	async function loadUserProfile() {
		try {
			await fetchProfile(ergo);
			console.log("Profile loaded:", $reputation_proof);
		} catch (err) {
			console.error("Error loading profile:", err);
		}
	}

	onMount(async () => {
		handleLoadThreads();

		// Load user profile if wallet is already connected
		if ($connected && typeof ergo !== "undefined") {
			await loadUserProfile();
		}
	});
</script>

<div class="forum-thread w-full">
	<div class="mb-6">
		<Label for="topic-id-input" class="text-base font-semibold"
			>Topic ID</Label
		>
		<div class="flex gap-2 mt-2">
			<Input
				type="text"
				id="topic-id-input"
				bind:value={topic_id}
				placeholder="Enter Topic/Project/Discussion ID"
				class="font-mono"
			/>
			<Button on:click={handleLoadThreads} variant="outline">Load</Button>
		</div>
	</div>

	<div class="mb-6 flex justify-between items-center">
		<div>
			<h3 class="text-xl font-bold mb-1">Project Discussions</h3>
			<p class="text-sm text-muted-foreground">
				Topic Score: <span
					class={topicScore > 0
						? "text-green-500"
						: topicScore < 0
							? "text-red-500"
							: "text-muted-foreground"}
					>{topicScore > 0 ? "+" : ""}{topicScore}</span
				>
			</p>
		</div>
		<Button
			variant="ghost"
			size="sm"
			on:click={() => (showAllComments = !showAllComments)}
		>
			{showAllComments ? "Hide" : "Show"} spam
		</Button>
	</div>

	<div class="mb-6">
		{#if !$connected}
			<div
				class="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-center"
			>
				<p class="text-amber-200">
					Connect your wallet to participate in discussions
				</p>
			</div>
		{:else if !hasProfile}
			<!-- Profile Creation Prompt -->
			<div class="bg-card p-4 rounded-lg border mb-4">
				<h4 class="font-semibold mb-2">Create Your Forum Profile</h4>
				<p class="text-sm text-muted-foreground mb-3">
					You need to create a profile before posting comments. This
					is a one-time blockchain transaction.
				</p>
				<Button
					on:click={handleCreateProfile}
					disabled={isCreatingProfile}
					class="w-full"
				>
					<UserPlus class="w-4 h-4 mr-2" />
					{isCreatingProfile
						? "Creating Profile..."
						: "Create Profile (One-time)"}
				</Button>
			</div>
		{:else}
			<!-- New Comment Form -->
			<div class="bg-card p-4 rounded-lg border mb-4">
				<Textarea
					bind:value={newCommentText}
					placeholder="Share your thoughts about this project..."
					class="mb-3"
					rows="3"
				/>

				<div class="flex flex-col sm:flex-row sm:items-center gap-3">
					<div class="flex gap-2 w-full sm:w-auto">
						<Button
							variant={sentiment === true ? "default" : "outline"}
							size="sm"
							on:click={() => (sentiment = true)}
						>
							<ThumbsUp class="w-4 h-4 mr-1" />
							Positive
						</Button>
						<Button
							variant={sentiment === false
								? "default"
								: "outline"}
							size="sm"
							on:click={() => (sentiment = false)}
						>
							<ThumbsDown class="w-4 h-4 mr-1" />
							Negative
						</Button>
					</div>

					<Button
						on:click={handlePostComment}
						disabled={isPostingComment || !newCommentText.trim()}
						class="w-full sm:w-auto sm:ml-auto"
					>
						{isPostingComment ? "Posting..." : "Post Comment"}
					</Button>
				</div>
			</div>
		{/if}

		{#if postError}
			<div
				class="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg mb-4"
			>
				<p class="text-sm text-blue-200">{postError}</p>
			</div>
		{/if}
	</div>

	<!-- Comments List -->
	{#if $isLoading}
		<div class="text-center py-8">
			<p class="text-muted-foreground">Loading discussions...</p>
		</div>
	{:else if $error}
		<div class="text-center py-8">
			<p class="text-destructive">{$error}</p>
		</div>
	{:else if allComments.length === 0}
		<div class="text-center py-8">
			<p class="text-muted-foreground">
				No discussions yet. Be the first to comment!
			</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each allComments as comment}
				{@const rendered = renderComment(comment, comment.depth || 0)}
				{#if rendered}
					<div
						class="bg-card p-4 rounded-lg border"
						style="margin-left: {rendered.marginLeft}px"
					>
						<div class="flex items-start gap-3">
							<div class="flex-shrink-0">
								{@html getAvatarSvg(
									comment.authorProfileTokenId,
									40,
								)}
							</div>

							<div class="flex-1 min-w-0">
								<div
									class="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2"
								>
									<span
										class="text-sm font-medium text-primary"
									>
										@{comment.authorProfileTokenId.slice(
											0,
											6,
										)}
									</span>

									<a
										class="flex items-center text-xs text-muted-foreground gap-1 cursor-pointer"
										style="margin-right: 2rem;"
										href={$web_explorer_uri_tx + comment.tx}
										target="_blank"
										rel="noopener noreferrer"
									>
										#{comment.id.slice(0, 6)}
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="w-3 h-3"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M14 3h7v7m0-7L10 14m-4 0H3v-7a2 2 0 012-2h7z"
											/>
										</svg>
									</a>

									{#if comment.sentiment}
										<div title={`Score: ${rendered.score}`}>
											<ThumbsUp
												class="w-3 h-3 text-green-500"
											/>
										</div>
									{:else}
										<div title={`Score: ${rendered.score}`}>
											<ThumbsDown
												class="w-3 h-3 text-red-500"
											/>
										</div>
									{/if}

									<span class="text-xs text-muted-foreground">
										{#if comment.posting}
											<a
												href={$web_explorer_uri_tx +
													comment.tx}
												target="_blank"
												rel="noopener noreferrer"
												class="text-blue-400 hover:underline pulse-animate"
											>
												Posting...
											</a>
										{:else}
											{new Date(
												comment.timestamp,
											).toLocaleString()}
										{/if}
									</span>
								</div>

								<div class="prose prose-sm max-w-none">
									{@html comment.text}
								</div>

								{#if comment.isSpam}
									<span
										class="text-xs text-amber-600 mt-2 inline-block"
									>
										⚠️ Flagged as spam
									</span>
								{/if}

								{#if hasProfile && !comment.isSpam}
									<div class="flex gap-2 mt-3">
										<Button
											variant="ghost"
											size="sm"
											on:click={() =>
												(replyingToId = comment.id)}
											class="text-xs h-7"
										>
											<Reply class="w-3 h-3 mr-1" />
											Reply
										</Button>
										<Button
											variant="ghost"
											size="sm"
											on:click={() =>
												handleFlagSpam(comment.id)}
											disabled={flaggingSpamId ===
												comment.id}
											class="text-xs h-7 text-amber-600 hover:text-amber-500"
										>
											<Flag class="w-3 h-3 mr-1" />
											{flaggingSpamId === comment.id
												? "Flagging..."
												: "Flag Spam"}
										</Button>
									</div>
								{/if}

								{#if replyingToId === comment.id}
									<div
										class="mt-4 bg-secondary/50 p-3 rounded-lg"
									>
										<Textarea
											bind:value={replyText}
											placeholder="Write your reply..."
											class="mb-3"
											rows="2"
										/>

										<div
											class="flex flex-col sm:flex-row sm:items-center gap-3"
										>
											<div
												class="flex gap-2 w-full sm:w-auto"
											>
												<Button
													variant={replySentiment ===
													true
														? "default"
														: "outline"}
													size="sm"
													on:click={() =>
														(replySentiment = true)}
												>
													<ThumbsUp
														class="w-4 h-4 mr-1"
													/>
													Positive
												</Button>
												<Button
													variant={replySentiment ===
													false
														? "default"
														: "outline"}
													size="sm"
													on:click={() =>
														(replySentiment = false)}
												>
													<ThumbsDown
														class="w-4 h-4 mr-1"
													/>
													Negative
												</Button>
											</div>

											<div
												class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-auto"
											>
												<Button
													variant="outline"
													size="sm"
													on:click={() => {
														replyingToId = null;
														replyText = "";
														replySentiment = null;
													}}
												>
													Cancel
												</Button>
												<Button
													size="sm"
													on:click={() =>
														handleReply(comment.id)}
													disabled={isPostingReply ||
														!replyText.trim()}
												>
													{isPostingReply
														? "Posting..."
														: "Post Reply"}
												</Button>
											</div>
										</div>
									</div>
								{/if}
							</div>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/if}
</div>

<style>
	.prose :global(p) {
		margin-bottom: 0.5rem;
	}

	.prose :global(a) {
		color: rgb(59 130 246);
		text-decoration: underline;
	}
</style>
