import { truncateToWidth, visibleWidth } from "@imlalitpandit/pi-tui";
import { theme } from "../theme/theme.js";
/**
 * Sanitize text for display in a single-line status.
 * Removes newlines, tabs, carriage returns, and other control characters.
 */
function sanitizeStatusText(text) {
    // Replace newlines, tabs, carriage returns with space, then collapse multiple spaces
    return text
        .replace(/[\r\n\t]/g, " ")
        .replace(/ +/g, " ")
        .trim();
}
/**
 * Format token counts (similar to web-ui)
 */
function formatTokens(count) {
    if (count < 1000)
        return count.toString();
    if (count < 10000)
        return `${(count / 1000).toFixed(1)}k`;
    if (count < 1000000)
        return `${Math.round(count / 1000)}k`;
    if (count < 10000000)
        return `${(count / 1000000).toFixed(1)}M`;
    return `${Math.round(count / 1000000)}M`;
}
/**
 * Footer component that shows pwd, token stats, and context usage.
 * Computes token/context stats from session, gets git branch and extension statuses from provider.
 */
export class FooterComponent {
    session;
    footerData;
    autoCompactEnabled = true;
    constructor(session, footerData) {
        this.session = session;
        this.footerData = footerData;
    }
    setAutoCompactEnabled(enabled) {
        this.autoCompactEnabled = enabled;
    }
    /**
     * No-op: git branch caching now handled by provider.
     * Kept for compatibility with existing call sites in interactive-mode.
     */
    invalidate() {
        // No-op: git branch is cached/invalidated by provider
    }
    /**
     * Clean up resources.
     * Git watcher cleanup now handled by provider.
     */
    dispose() {
        // Git watcher cleanup handled by provider
    }
    render(width) {
        const state = this.session.state;
        // Calculate cumulative usage from ALL session entries (not just post-compaction messages)
        let totalInput = 0;
        let totalOutput = 0;
        let totalCacheRead = 0;
        let totalCacheWrite = 0;
        let totalCost = 0;
        for (const entry of this.session.sessionManager.getEntries()) {
            if (entry.type === "message" && entry.message.role === "assistant") {
                totalInput += entry.message.usage.input;
                totalOutput += entry.message.usage.output;
                totalCacheRead += entry.message.usage.cacheRead;
                totalCacheWrite += entry.message.usage.cacheWrite;
                totalCost += entry.message.usage.cost.total;
            }
        }
        // Calculate context usage from session (handles compaction correctly).
        // After compaction, tokens are unknown until the next LLM response.
        const contextUsage = this.session.getContextUsage();
        const contextWindow = contextUsage?.contextWindow ?? state.model?.contextWindow ?? 0;
        const contextPercentValue = contextUsage?.percent ?? 0;
        const contextPercent = contextUsage?.percent !== null ? contextPercentValue.toFixed(1) : "?";
        // Replace home directory with ~
        let pwd = process.cwd();
        const home = process.env.HOME || process.env.USERPROFILE;
        if (home && pwd.startsWith(home)) {
            pwd = `~${pwd.slice(home.length)}`;
        }
        // Add git branch if available
        const branch = this.footerData.getGitBranch();
        if (branch) {
            pwd = `${pwd} (${branch})`;
        }
        // Add session name if set
        const sessionName = this.session.sessionManager.getSessionName();
        if (sessionName) {
            pwd = `${pwd} • ${sessionName}`;
        }
        
        // Auto compaction indicator
        const autoIndicator = this.autoCompactEnabled ? " (auto)" : "";
        
        // Build stats line (will go on RIGHT side)
        const contextPercentStr = contextPercent === "?"
            ? `?/${formatTokens(contextWindow)}${autoIndicator}`
            : `${contextPercent}%/${formatTokens(contextWindow)}${autoIndicator}`;
        
        // Colorize context percentage based on usage
        let coloredContextPercent;
        if (contextPercentValue > 90) {
            coloredContextPercent = theme.fg("error", contextPercentStr);
        }
        else if (contextPercentValue > 70) {
            coloredContextPercent = theme.fg("warning", contextPercentStr);
        }
        else {
            coloredContextPercent = theme.fg("dim", contextPercentStr);
        }
        
        // Right side: Token stats
        const statsParts = [];
        const usingSubscription = state.model ? this.session.modelRegistry.isUsingOAuth(state.model) : false;
        if (totalInput) statsParts.push(`↑${formatTokens(totalInput)}`);
        if (totalOutput) statsParts.push(`↓${formatTokens(totalOutput)}`);
        if (totalCacheRead) statsParts.push(`R${formatTokens(totalCacheRead)}`);
        if (totalCacheWrite) statsParts.push(`W${formatTokens(totalCacheWrite)}`);
        if (totalCost || usingSubscription) {
            const costStr = `$${totalCost.toFixed(3)}${usingSubscription ? " (sub)" : ""}`;
            statsParts.push(costStr);
        }
        statsParts.push(coloredContextPercent);
        
        const statsRight = theme.fg("dim", statsParts.join(" "));
        
        // Left side: Command role + Directory + Model
        const modelName = state.model?.id || "no-model";
        const commandRole = "🔱 Chief of Staff";
        let leftSide = `${commandRole} • ${pwd}`;
        
        // Add thinking level indicator if model supports reasoning
        if (state.model?.reasoning) {
            const thinkingLevel = state.thinkingLevel || "off";
            const thinkingIndicator = thinkingLevel === "off" ? "" : ` • ${thinkingLevel}`;
            leftSide = `${leftSide} • ${modelName}${thinkingIndicator}`;
        } else {
            leftSide = `${leftSide} • ${modelName}`;
        }
        
        // Calculate widths and padding
        const statsRightWidth = visibleWidth(statsParts.join(" ")); // Use plain text for width calc
        const leftSidePlain = leftSide;
        const leftSideWidth = visibleWidth(leftSidePlain);
        const minPadding = 2;
        
        let leftSideFormatted;
        let padding = "";
        
        if (leftSideWidth + minPadding + statsRightWidth <= width) {
            // Calculate padding to push stats to right
            padding = " ".repeat(width - leftSideWidth - statsRightWidth);
            leftSideFormatted = theme.fg("dim", leftSide);
        } else {
            // Not enough space, truncate left side
            const maxLeftWidth = width - statsRightWidth - minPadding;
            leftSideFormatted = theme.fg("dim", truncateToWidth(leftSide, maxLeftWidth, theme.fg("dim", "...")));
            padding = " ".repeat(minPadding);
        }
        
        // Combine: [Left: Dir+Model] + [Padding] + [Right: Stats]
        const statsLine = leftSideFormatted + padding + statsRight;
        
        const lines = [statsLine];
        
        // Add extension statuses on a single line, sorted by key alphabetically
        const extensionStatuses = this.footerData.getExtensionStatuses();
        if (extensionStatuses.size > 0) {
            const sortedStatuses = Array.from(extensionStatuses.entries())
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([, text]) => sanitizeStatusText(text));
            const statusLine = sortedStatuses.join(" ");
            // Truncate to terminal width with dim ellipsis for consistency with footer style
            lines.push(truncateToWidth(statusLine, width, theme.fg("dim", "...")));
        }
        return lines;
    }
}
//# sourceMappingURL=footer.js.map