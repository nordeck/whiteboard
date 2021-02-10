export function checkUserRole(res) {
    return (
        res &&
        res.results &&
        res.power_levels &&
        res.power_levels.room &&
        res.results.room_membership &&
        res.power_levels.user >= res.power_levels.room.kick
    );
}
