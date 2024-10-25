import { StyleSheet, View } from "react-native";
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import MyMap from "./components/MyMap";
import { AppRegistry } from 'react-native';
import { PaperProvider } from 'react-native-paper';
export default function App() {
  async function initializeDatabase(db:SQLiteDatabase): Promise<void> {
    try {
      await db.execAsync(`PRAGMA journal_mode = WAL;`);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS contactos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          direccion TEXT NOT NULL,
          notas TEXT,
          telefono INTEGER,
          lat REAL NOT NULL,
          lng REAL NOT NULL, 
          tipo TEXT NOT NULL
        );
      `);
            
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS repartos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nombre TEXT NOT NULL,
          direccion TEXT NOT NULL,
          descripcion TEXT,
          finalizado BOOL,
          lat REAL NOT NULL,
          lng REAL NOT NULL,
          notas TEXT,
          telefono INTEGER,
          tipo_contacto TEXT,
          IDContacto INTEGER,
          fecha DATE
        );
      `); 
    } catch (error) {
        console.log('Error while initializing database : ', error);
    }
}
  return (
    
    <SQLiteProvider databaseName="rutapp_db" onInit={initializeDatabase}>
      <PaperProvider>
    <View style={styles.container}>    
    <MyMap/>
    </View>
    </PaperProvider>
    </SQLiteProvider>
  );
}

AppRegistry.registerComponent('rutapp',()=>App)

const styles = StyleSheet.create({
  container: {
    width:"100%",
    flex: 1,
    backgroundColor: "#051b37",
    marginTop: 40
    
  },
 
});
