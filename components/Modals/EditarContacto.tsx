import { MapMarker } from 'expo-leaflet';
import React, { useEffect, useState } from 'react'
import { View, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import IDatosContacto from '@/interfaces/IDatosContacto';
import { Button, RadioButton, Snackbar, TextInput } from 'react-native-paper';
import IcontactosSQL from '@/interfaces/IContactosSQL';


interface IProps {
    datos: IcontactosSQL,
    setModalVisible: (bool: boolean) => void,
    // ubicacionSeleccionada: MapMarker[],

}

const EditarContacto: React.FC<IProps> = ({ setModalVisible,  datos }) => {
    const [mensaje, setMensaje] = useState({ bool: false, texto: "", error: true });

    const [data, setData] = useState<IDatosContacto>({ nombre: datos.nombre, tipo: datos.tipo, direccion: datos.direccion, telefono: datos.telefono == null ? "":datos.telefono.toString(), nota: datos.notas, lat: datos.lat, lng: datos.lng });
    const db = useSQLiteContext();
    useEffect(() => {
        console.log(data);
    }, [data])
    const crear = async () => {
        if (!data.nombre || !data.direccion) {
            setMensaje({ bool: true, texto: "Nombre y dirección no pueden estar vacios", error: true })
        } else {

            const editadoo = await db.runAsync('UPDATE contactos SET nombre = ?, direccion = ?, telefono = ?, tipo=?, notas=?, lat=?, lng=? WHERE id = ?', data.nombre, data.direccion, data.telefono != null ? parseInt(data.telefono) : null, data.tipo, data.nota, data.lat, data.lng, datos.id);
            console.log(editadoo)
            setMensaje({ bool: true, texto: "Contacto editado con éxito, en breve se dirigirá a la vista de contactos", error: false })


        }
    }
    return (
        <View style={{ width: "100%", paddingHorizontal: 20, paddingTop: 10, flex: 1, backgroundColor: "white", gap: 10 }}>
            {/* comments */}
            <Button style={{ alignSelf: "flex-start" }} onPress={() => setModalVisible(false)}>Volver</Button>
            <Button style={{ alignSelf: "flex-end" }} onPress={() => setModalVisible(false)}>cambiar ubicación</Button>

            <TextInput
                label="Nombre"
                value={data.nombre}
                mode="outlined"
                activeOutlineColor='#000'
                onChangeText={text => setData({ ...data, nombre: text })} />
            <TextInput
                label="Dirección"
                value={data.direccion}
                mode="outlined"
                activeOutlineColor='#000'
                onChangeText={text => setData({ ...data, direccion: text })} />

            <View style={{ display: "flex", justifyContent: "flex-start", flexDirection: "row", gap: 5 }}>

                <TextInput
                    label="Número de telefono"
                    keyboardType='numeric'
                    value={data.telefono}
                    mode="outlined"
                    style={{ width: "70%" }}
                    activeOutlineColor='#000'
                    onChangeText={text => setData({ ...data, telefono: text })} />
            </View>
            <View>
                <Text>Seleccione tipo de contacto:</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <RadioButton
                        value="cliente"

                        status={data.tipo === 'cliente' ? 'checked' : 'unchecked'}
                        onPress={() => setData({ ...data, tipo: "cliente" })}
                    />
                    <Text>Cliente</Text>
                </View>


                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <RadioButton
                        value="proveedor"

                        status={data.tipo === 'proveedor' ? 'checked' : 'unchecked'}
                        onPress={() => setData({ ...data, tipo: "proveedor" })}
                    />
                    <Text>Proveedor</Text>
                </View>


            </View>
            <TextInput
                label="Nota"
                value={data.nota}
                mode="outlined"
                activeOutlineColor='#000'
                onChangeText={text => setData({ ...data, nota: text })} />
            <Button mode='contained' onPress={crear}>Editar contacto</Button>
            <Snackbar style={{ backgroundColor: mensaje.error ? "#ff3a30" : "#386b38" }} rippleColor={"black"} visible={mensaje.bool} onDismiss={() => setMensaje({ ...mensaje, bool: false })}>{mensaje.texto}</Snackbar>
        </View>
    )
}

export default EditarContacto