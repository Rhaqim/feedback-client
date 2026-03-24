<script lang="ts">
	import { onMount } from "svelte";
	import {
		gmListFeeds,
		gmListChallenges,
		gmCurate,
		gmDeleteChallenge,
		gmDismissFeed,
		triggerFeedFetch,
		listRegions,
	} from "../lib/api";
	import type {
		FeedItem,
		CuratedChallenge,
		Region,
		Tag,
	} from "../lib/types";
	import { ALL_TAGS, TAG_COLORS, TAG_LABELS } from "../lib/types";

	let feedItems: FeedItem[] = [];
	let curatedChallenges: CuratedChallenge[] = [];
	let regions: Region[] = [];
	let loading = false;
	let error = "";
	let notification = "";

	// Filters
	let filterTag = "";
	let filterRegionId = "";
	let filterUnused = true;

	// Tabs
	let activeTab: "feeds" | "curated" = "feeds";

	// Curation form
	let showCurateForm = false;
	let curateFromItem: FeedItem | null = null;
	let curateTitle = "";
	let curateDescription = "";
	let curateTag: Tag = "security";
	let curateRegionId = "";
	let curateSeverity = 5;
	let curateSource = "rss";
	let curateSourceURL = "";
	let curateNotes = "";
	let curating = false;

	// Fetching
	let fetching = false;

	onMount(async () => {
		await Promise.all([loadFeeds(), loadCurated(), loadRegions()]);
	});

	async function loadRegions() {
		try {
			regions = await listRegions();
		} catch {
			// ignore
		}
	}

	async function loadFeeds() {
		loading = true;
		try {
			feedItems = await gmListFeeds(
				filterTag || undefined,
				filterRegionId || undefined,
				filterUnused,
			);
		} catch (e: any) {
			error = e.message || "Failed to load feeds";
		}
		loading = false;
	}

	async function loadCurated() {
		try {
			curatedChallenges = await gmListChallenges(
				filterTag || undefined,
				filterRegionId || undefined,
			);
		} catch (e: any) {
			error = e.message || "Failed to load curated challenges";
		}
	}

	async function handleFetchFeeds() {
		fetching = true;
		error = "";
		try {
			const result = await triggerFeedFetch();
			notification = `Fetched ${result.count} feed items`;
			setTimeout(() => (notification = ""), 4000);
			await loadFeeds();
		} catch (e: any) {
			error = e.message || "Failed to fetch feeds";
		}
		fetching = false;
	}

	function openCurateForm(item: FeedItem) {
		curateFromItem = item;
		curateTitle = item.title;
		curateDescription = item.description;
		curateTag = item.tag;
		curateRegionId = item.region_id || "";
		curateSeverity = 5;
		curateSource = item.feed_name || "rss";
		curateSourceURL = item.url || "";
		curateNotes = "";
		showCurateForm = true;
	}

	function openCurateFormBlank() {
		curateFromItem = null;
		curateTitle = "";
		curateDescription = "";
		curateTag = "security";
		curateRegionId = "";
		curateSeverity = 5;
		curateSource = "custom";
		curateSourceURL = "";
		curateNotes = "";
		showCurateForm = true;
	}

	async function handleCurate() {
		if (!curateTitle.trim() || !curateDescription.trim()) return;
		curating = true;
		error = "";
		try {
			await gmCurate({
				feed_item_id: curateFromItem ? curateFromItem.id : undefined,
				tag: curateTag,
				region_id: curateRegionId,
				title: curateTitle.trim(),
				description: curateDescription.trim(),
				source: curateSource,
				source_url: curateSourceURL.trim(),
				severity: curateSeverity,
				curator_notes: curateNotes.trim(),
			});
			showCurateForm = false;
			notification = "Challenge curated successfully";
			setTimeout(() => (notification = ""), 4000);
			await Promise.all([loadFeeds(), loadCurated()]);
		} catch (e: any) {
			error = e.message || "Failed to curate challenge";
		}
		curating = false;
	}

	async function handleDismiss(id: number) {
		try {
			await gmDismissFeed(id);
			feedItems = feedItems.filter(fi => fi.id !== id);
		} catch (e: any) {
			error = e.message || "Failed to dismiss";
		}
	}

	async function handleDeleteCurated(id: number) {
		try {
			await gmDeleteChallenge(id);
			curatedChallenges = curatedChallenges.filter(cc => cc.id !== id);
		} catch (e: any) {
			error = e.message || "Failed to delete";
		}
	}

	function applyFilters() {
		loadFeeds();
		loadCurated();
	}

	function formatDate(dateStr: string): string {
		try {
			return new Date(dateStr).toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
				hour: "2-digit",
				minute: "2-digit",
			});
		} catch {
			return dateStr;
		}
	}

	function getRegionName(regionId: string): string {
		const r = regions.find(r => r.id === regionId);
		return r ? r.name : regionId || "Global";
	}

	function severityDots(severity: number): string {
		return "●".repeat(Math.min(severity, 10));
	}

	function severityColor(severity: number): string {
		if (severity >= 8) return "var(--danger)";
		if (severity >= 5) return "var(--warning)";
		return "var(--success)";
	}
</script>

<div class="gm">
	<header class="gm-header">
		<div class="header-top">
			<a href="/" class="back-link">&larr; Back to Lobby</a>
		</div>
		<h1 class="title">
			<span class="title-game">GAME</span><span class="title-master">MASTER</span>
		</h1>
		<p class="tagline">Review feeds. Curate challenges. Shape the game.</p>
	</header>

	{#if error}
		<div class="banner banner-error">
			{error}
			<button class="banner-dismiss" on:click={() => (error = "")}>×</button>
		</div>
	{/if}

	{#if notification}
		<div class="banner banner-notify">{notification}</div>
	{/if}

	<!-- Filter Bar -->
	<div class="filter-bar card">
		<div class="filter-row">
			<div class="filter-group">
				<label for="filter-tag">Tag</label>
				<select id="filter-tag" bind:value={filterTag} on:change={applyFilters}>
					<option value="">All Tags</option>
					{#each ALL_TAGS as tag}
						<option value={tag}>{TAG_LABELS[tag]}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group">
				<label for="filter-region">Region</label>
				<select id="filter-region" bind:value={filterRegionId} on:change={applyFilters}>
					<option value="">All Regions</option>
					{#each regions as region}
						<option value={region.id}>{region.name}</option>
					{/each}
				</select>
			</div>

			<div class="filter-group filter-checkbox">
				<label>
					<input type="checkbox" bind:checked={filterUnused} on:change={applyFilters} />
					Unused only
				</label>
			</div>

			<div class="filter-actions">
				<button class="btn-primary" on:click={handleFetchFeeds} disabled={fetching}>
					{fetching ? "Fetching..." : "Fetch Feeds Now"}
				</button>
				<button class="btn-secondary" on:click={openCurateFormBlank}>
					+ Create Challenge
				</button>
			</div>
		</div>
	</div>

	<!-- Tab Bar -->
	<div class="tab-bar">
		<button
			class="tab-btn"
			class:active-tab={activeTab === "feeds"}
			on:click={() => (activeTab = "feeds")}
		>
			Feed Items ({feedItems.length})
		</button>
		<button
			class="tab-btn"
			class:active-tab={activeTab === "curated"}
			on:click={() => (activeTab = "curated")}
		>
			Curated Challenges ({curatedChallenges.length})
		</button>
	</div>

	<!-- Content -->
	<div class="content">
		{#if activeTab === "feeds"}
			{#if loading}
				<div class="empty-state card"><p>Loading feeds...</p></div>
			{:else if feedItems.length === 0}
				<div class="empty-state card">
					<p>No feed items found. Try fetching feeds or adjusting filters.</p>
				</div>
			{:else}
				<div class="items-list">
					{#each feedItems as item (item.id)}
						<div class="feed-card card fade-in">
							<div class="feed-info">
								<div class="feed-header">
									<h3>{item.title}</h3>
									{#if item.used_in_game}
										<span class="status-badge used-badge">Used</span>
									{/if}
								</div>
								<p class="feed-desc">{item.description || "No description available."}</p>
								<div class="feed-meta">
									<span
										class="tag-badge"
										style="background: {TAG_COLORS[item.tag]}20; color: {TAG_COLORS[item.tag]}"
									>
										{TAG_LABELS[item.tag]}
									</span>
									<span class="meta-item">{getRegionName(item.region_id)}</span>
									<span class="meta-sep">|</span>
									<span class="meta-item">{item.feed_name}</span>
									<span class="meta-sep">|</span>
									<span class="meta-item">{formatDate(item.published_at)}</span>
									{#if item.url}
										<span class="meta-sep">|</span>
										<a href={item.url} target="_blank" rel="noopener" class="meta-link">Source</a>
									{/if}
								</div>
							</div>
							<div class="feed-actions">
								<button class="btn-success" on:click={() => openCurateForm(item)}>
									Create Challenge
								</button>
								<button class="btn-danger btn-sm" on:click={() => handleDismiss(item.id)}>
									Dismiss
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{:else}
			{#if curatedChallenges.length === 0}
				<div class="empty-state card">
					<p>No curated challenges yet. Create one from the Feed Items tab.</p>
				</div>
			{:else}
				<div class="items-list">
					{#each curatedChallenges as cc (cc.id)}
						<div class="curated-card card fade-in">
							<div class="feed-info">
								<div class="feed-header">
									<h3>{cc.title}</h3>
									<div class="status-badges">
										{#if cc.used_in_game}
											<span class="status-badge used-badge">Used in Game</span>
										{:else}
											<span class="status-badge ready-badge">Ready</span>
										{/if}
									</div>
								</div>
								<p class="feed-desc">{cc.description}</p>
								<div class="feed-meta">
									<span
										class="tag-badge"
										style="background: {TAG_COLORS[cc.tag]}20; color: {TAG_COLORS[cc.tag]}"
									>
										{TAG_LABELS[cc.tag]}
									</span>
									<span class="meta-item">{getRegionName(cc.region_id)}</span>
									<span class="meta-sep">|</span>
									<span class="severity-dots" style="color: {severityColor(cc.severity)}">
										{severityDots(cc.severity)}
									</span>
									<span class="meta-item">Severity {cc.severity}/10</span>
									<span class="meta-sep">|</span>
									<span class="meta-item">{cc.source}</span>
									<span class="meta-sep">|</span>
									<span class="meta-item">{formatDate(cc.created_at)}</span>
									{#if cc.source_url}
										<span class="meta-sep">|</span>
										<a href={cc.source_url} target="_blank" rel="noopener" class="meta-link">Article</a>
									{/if}
								</div>
								{#if cc.curator_notes}
									<p class="curator-notes">Note: {cc.curator_notes}</p>
								{/if}
							</div>
							<div class="feed-actions">
								<button class="btn-danger btn-sm" on:click={() => handleDeleteCurated(cc.id)}>
									Remove
								</button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		{/if}
	</div>
</div>

<!-- Curation Modal -->
{#if showCurateForm}
	<div class="modal-overlay" on:click|self={() => (showCurateForm = false)} on:keydown={(e) => e.key === 'Escape' && (showCurateForm = false)}>
		<div class="modal card">
			<h2>Create Curated Challenge</h2>
			{#if curateFromItem}
				<p class="source-note">Based on: <em>{curateFromItem.title}</em></p>
			{/if}

			<form on:submit|preventDefault={handleCurate} class="curate-form">
				<div class="form-group">
					<label for="curate-title">Title</label>
					<input
						id="curate-title"
						type="text"
						bind:value={curateTitle}
						placeholder="Challenge title..."
					/>
				</div>

				<div class="form-group">
					<label for="curate-desc">Description</label>
					<textarea
						id="curate-desc"
						bind:value={curateDescription}
						placeholder="Describe the challenge players must solve..."
						rows="4"
					></textarea>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="curate-tag">Tag</label>
						<select id="curate-tag" bind:value={curateTag}>
							{#each ALL_TAGS as tag}
								<option value={tag}>{TAG_LABELS[tag]}</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="curate-region">Region</label>
						<select id="curate-region" bind:value={curateRegionId}>
							<option value="">Global (all regions)</option>
							{#each regions as region}
								<option value={region.id}>{region.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="form-row">
					<div class="form-group">
						<label for="curate-severity">Severity: {curateSeverity}/10</label>
						<input
							id="curate-severity"
							type="range"
							min="1"
							max="10"
							bind:value={curateSeverity}
						/>
						<div class="severity-preview">
							<span style="color: {severityColor(curateSeverity)}">
								{severityDots(curateSeverity)}
							</span>
						</div>
					</div>

					<div class="form-group">
						<label for="curate-source">Source</label>
						<input
							id="curate-source"
							type="text"
							bind:value={curateSource}
							placeholder="e.g. reuters, bbc"
						/>
					</div>
				</div>

				<div class="form-group">
					<label for="curate-source-url">Source URL</label>
					<input
						id="curate-source-url"
						type="url"
						bind:value={curateSourceURL}
						placeholder="https://..."
					/>
				</div>

				<div class="form-group">
					<label for="curate-notes">Curator Notes (optional)</label>
					<textarea
						id="curate-notes"
						bind:value={curateNotes}
						placeholder="Internal notes about why this challenge is relevant..."
						rows="2"
					></textarea>
				</div>

				<div class="modal-actions">
					<button
						type="submit"
						class="btn-success"
						disabled={!curateTitle.trim() || !curateDescription.trim() || curating}
					>
						{curating ? "Creating..." : "Create Challenge"}
					</button>
					<button type="button" class="btn-secondary" on:click={() => (showCurateForm = false)}>
						Cancel
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.gm {
		max-width: 1000px;
		margin: 0 auto;
		padding: 1.5rem;
		min-height: 100vh;
	}

	.gm-header {
		text-align: center;
		padding: 2rem 0 1.5rem;
	}

	.header-top {
		text-align: left;
		margin-bottom: 1rem;
	}

	.back-link {
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.85rem;
	}

	.back-link:hover {
		color: var(--accent);
	}

	.title {
		font-size: 2.8rem;
		letter-spacing: 0.08em;
		margin-bottom: 0.5rem;
	}

	.title-game {
		color: var(--text-primary);
	}

	.title-master {
		color: var(--accent);
	}

	.tagline {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	/* Banners */
	.banner {
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
		font-size: 0.85rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.banner-error {
		background: rgba(229, 62, 62, 0.15);
		color: var(--danger);
		border: 1px solid rgba(229, 62, 62, 0.3);
	}

	.banner-notify {
		background: rgba(99, 102, 241, 0.15);
		color: var(--accent);
		border: 1px solid rgba(99, 102, 241, 0.3);
	}

	.banner-dismiss {
		background: none;
		border: none;
		color: inherit;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0 0.25rem;
	}

	/* Filter Bar */
	.filter-bar {
		margin-bottom: 1rem;
	}

	.filter-row {
		display: flex;
		align-items: flex-end;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.filter-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.filter-group label {
		font-size: 0.7rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.filter-group select {
		min-width: 140px;
	}

	.filter-checkbox {
		justify-content: flex-end;
	}

	.filter-checkbox label {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-size: 0.8rem;
		color: var(--text-secondary);
		text-transform: none;
		cursor: pointer;
	}

	.filter-actions {
		display: flex;
		gap: 0.5rem;
		margin-left: auto;
	}

	/* Tab Bar */
	.tab-bar {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1rem;
	}

	.tab-btn {
		padding: 0.6rem 1.2rem;
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		color: var(--text-muted);
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}

	.tab-btn:hover {
		color: var(--text-secondary);
	}

	.active-tab {
		color: var(--accent);
		border-bottom-color: var(--accent);
	}

	/* Items List */
	.items-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.feed-card,
	.curated-card {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.feed-info {
		flex: 1;
		min-width: 0;
	}

	.feed-header {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		margin-bottom: 0.4rem;
	}

	.feed-header h3 {
		font-size: 1rem;
		line-height: 1.4;
		flex: 1;
	}

	.feed-desc {
		color: var(--text-secondary);
		font-size: 0.85rem;
		line-height: 1.5;
		margin-bottom: 0.5rem;
		display: -webkit-box;
		-webkit-line-clamp: 3;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.feed-meta {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		font-size: 0.75rem;
	}

	.meta-item {
		color: var(--text-secondary);
	}

	.meta-sep {
		color: var(--text-muted);
	}

	.meta-link {
		color: var(--accent);
		text-decoration: none;
	}

	.meta-link:hover {
		text-decoration: underline;
	}

	.feed-actions {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
		flex-shrink: 0;
	}

	.btn-sm {
		padding: 0.3rem 0.6rem;
		font-size: 0.75rem;
	}

	.status-badges {
		display: flex;
		gap: 0.3rem;
	}

	.status-badge {
		padding: 0.1rem 0.4rem;
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		white-space: nowrap;
	}

	.used-badge {
		background: rgba(240, 180, 41, 0.15);
		color: var(--warning);
	}

	.ready-badge {
		background: rgba(56, 161, 105, 0.15);
		color: var(--success);
	}

	.severity-dots {
		font-size: 0.6rem;
		letter-spacing: -1px;
	}

	.curator-notes {
		color: var(--text-muted);
		font-size: 0.75rem;
		font-style: italic;
		margin-top: 0.4rem;
	}

	.empty-state {
		text-align: center;
		padding: 3rem;
		color: var(--text-muted);
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 200;
		padding: 1rem;
	}

	.modal {
		width: 100%;
		max-width: 640px;
		max-height: 90vh;
		overflow-y: auto;
	}

	.modal h2 {
		margin-bottom: 0.75rem;
		font-size: 1.2rem;
	}

	.source-note {
		color: var(--text-muted);
		font-size: 0.8rem;
		margin-bottom: 1rem;
		padding: 0.5rem;
		background: var(--bg-secondary);
		border-radius: 6px;
	}

	.curate-form {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.3rem;
	}

	.form-group label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.75rem;
	}

	.severity-preview {
		font-size: 0.7rem;
		letter-spacing: -1px;
		margin-top: 0.2rem;
	}

	.modal-actions {
		display: flex;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	@media (max-width: 700px) {
		.filter-row {
			flex-direction: column;
			align-items: stretch;
		}

		.filter-actions {
			margin-left: 0;
		}

		.feed-card,
		.curated-card {
			flex-direction: column;
		}

		.feed-actions {
			flex-direction: row;
			width: 100%;
		}

		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>
