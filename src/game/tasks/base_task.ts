import { Player } from "../player";

/**
 * The server implementation of a task. Each instance of a task type is to be it's own object.
 */
export abstract class BaseTask {
    /** The ID of this task on the map. */
    readonly id: string;

    /** Whether we require the player to scan the QR code once more when complete. */
    readonly requireConfirmationScan: boolean;

    /** Additional parameters supplied to the task in map.json. */
    readonly params: any;


    /**
     * Construct a task object.
     * @param id The ID of this task on the map.
     * @param requireConfirmationScan Whether we require the player to scan the QR code once more when complete.
     * @param params Additional parameters supplied to the task in map.json.
     */
    constructor(id: string, requireConfirmationScan: boolean, params: any) {
        this.id = id;
        this.requireConfirmationScan = requireConfirmationScan;
        this.params = params;
    }

    /**
     * Get the unique ID of this task type.
     * Used to synchronize task type between the server and client, as well as identify the task type in map.json.
     */
    abstract getClassID(): string;

    /**
     * Called when a player requests to start the task.
     * 
     * This is called BEFORE the client is sent information about the task.
     * Only use to setup animations.
     * @param player Player who's performing the task.
     * @param callback Called when the task is complete.
     */
    beginTask(player: Player, callback: (complete: boolean) => void): void {
        // Callback is called once client confirms it has started the task.
        player.client.emit('doTask', this.id, (data: {started: boolean}) => {
            if (data.started) {
                this.doTask(player, callback);
            }
        });

        player.client.once('taskFinished', (data: {aborted: boolean}) => {
            this.onTaskFinished(player, data.aborted);
            if (!this.requireConfirmationScan) {
                this.onTaskComplete(player);
            }
        })

        // We only want to listen for 'taskComplete' if we're requireing QR-Code confirmation.
        if (this.requireConfirmationScan) {
            player.client.once('taskComplete', () => {
                this.onTaskComplete(player);
            })
        }
    }

    /**
     * Called when a player begins to perform the task.
     * 
     * This function is only called once the client has confirmed that it has started the task,
     * meaning that you can expect to be able to communicate with the task's client counterpart.
     * @param player Player who's performing the task.
     * @param callback Called when the task is complete.
     */
    abstract doTask(player: Player, callback: (complete: boolean) => void): void;

    /**
     * Called when a player finishes a task but hasn't QR-Code verified yet.
     * @param player Player who aborted the task.
     * @param aborted If the player aborted the task.
     */
    abstract onTaskFinished(player: Player, aborted: boolean): void;

    /**
     * Called when a player completes a task and QR-Code verifies.
     * @param player Player who completed the task.
     */
    onTaskComplete(player: Player): void {
        player.completeTask(this.id);
    }
}