export function formatNumber(value: number): string {
	if (value >= 1_000_000) {
		return (value / 1_000_000).toFixed(1).replace(/\.0$/, "") + "M";
	} else if (value >= 10_000) {
		return Math.floor(value / 1_000) + "K";
	} else if (value >= 1_000) {
		return value.toLocaleString();
	}

	return value.toString();
}
