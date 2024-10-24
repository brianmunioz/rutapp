import AsyncStorage from '@react-native-async-storage/async-storage';

export default async function obtenerIDS(): Promise<string[]> {
    const ids = await AsyncStorage.getItem('ordenrepartos');
    if (!ids) {
        await AsyncStorage.setItem('ordenrepartos', '[]');
        return [];
    }
    return JSON.parse(ids) as string[];
}

