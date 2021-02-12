export function checkUserRole(res) {
    return (
        res &&
        res.results &&
        res.power_levels &&
        res.results.room_membership &&
        res.power_levels.user >= 50
    );
}
