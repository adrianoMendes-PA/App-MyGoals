import { useSQLiteContext } from "expo-sqlite/next";

export type GoalCreateDatabase = {
    name: string
    total: number
}

export type GoalResponseDatabase = {
    id: string
    name: string
    total: number,
    current: number
}

export function useGoalRepository() {
    const database = useSQLiteContext();

    function create(goal: GoalCreateDatabase) {
        try {
            const statement = database.prepareSync(
                "INSERT INTO goals (name, total) VALUES ($name, $total)"
            );
            statement.executeSync({
                $name: goal.name,
                $total: goal.total,
            });
        } catch (error) {
            throw error
        }
    }

    function all() {
        try {
            return database.getAllSync<GoalResponseDatabase>(`
                SELECT g.id, g.name, g.total, COALESCE(SUM(t.amount), 0) AS current
                FROM goals AS g
                LEFT JOIN transactions t ON t.goal_id = g.id
                GROUP BY g.id, g.name, g.total;
            `)
        } catch (error) {
            throw error
        }
    }

    function show(id: number) {
        const statement = database.prepareSync(`
            SELECT g.id, g.name, g.total, COALESCE(SUM(t.amount), 0) AS current
            FROM goals AS g
            LEFT JOIN transactions t ON t.goal_id = g.id
            WHERE g.id = $id
            GROUP BY g.id, g.name, g.total;
        `);
        const result = statement.executeSync<GoalResponseDatabase>({ $id: id });
        return result.getFirstSync();
    }

    function deleteGoal(id: number) {
        try {
            const deleteStatement = database.prepareSync(`
                DELETE FROM goals WHERE id = $id;
            `);
            const result = deleteStatement.executeSync({ $id: id });
            return result; // Indica que a exclusão foi bem-sucedida
        } catch (error) {
            console.error("Erro ao excluir meta:", error);
            return false; // Indica que ocorreu um erro ao excluir a meta
        }
    }


    return {
        create,
        all,
        show,
        deleteGoal
    }
}