import { ExpoLeaflet, MapLayer, MapMarker } from 'expo-leaflet';
import React, { useState } from 'react'
import { View, Text } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import IDatosContacto from '@/interfaces/IDatosContacto';
import { ActivityIndicator, Button, Icon, RadioButton, Snackbar, TextInput } from 'react-native-paper';
import IcontactosSQL from '@/interfaces/IContactosSQL';


interface IProps {
    datos: IcontactosSQL,
    setModalVisible: (bool: boolean) => void,
    pedirContactos: () => void,
    // ubicacionSeleccionada: MapMarker[],

}

const EditarContacto: React.FC<IProps> = ({ setModalVisible, datos, pedirContactos }) => {
    const [mensaje, setMensaje] = useState({ bool: false, texto: "", error: true });

    const [data, setData] = useState<IDatosContacto>({ nombre: datos.nombre, tipo: datos.tipo, direccion: datos.direccion, telefono: datos.telefono == null ? "" : datos.telefono.toString(), nota: datos.notas, lat: datos.lat, lng: datos.lng });
    const [editarUbicacion, setEditarUbicacion] = useState(false);
    const posInicial: MapMarker = {
        id: "ubicacion-seleccionada",
        position: { lat: datos.lat, lng: datos.lng },
        icon: `<svg style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>`,
        size: [15, 15],
    }
    const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<MapMarker>(posInicial);
    const db = useSQLiteContext();

    const editar = async () => {


        if (!data.nombre || !data.direccion) {
            setMensaje({ bool: true, texto: "Nombre y dirección no pueden estar vacios", error: true })
        } else {

            const editadoo = await db.runAsync('UPDATE contactos SET nombre = ?, direccion = ?, telefono = ?, tipo=?, notas=?, lat=?, lng=? WHERE id = ?', data.nombre, data.direccion, data.telefono != null ? parseInt(data.telefono) : null, data.tipo, data.nota, data.lat, data.lng, datos.id);
            console.log(editadoo)
            setMensaje({ bool: true, texto: "Contacto editado con éxito, en breve se dirigirá a la vista de contactos", error: false })
            pedirContactos()

        }
    }
    if (editarUbicacion) {
        const mapLayer: MapLayer = {
            baseLayerName: "OpenStreetMap",
            baseLayerIsChecked: true,
            layerType: "TileLayer",
            baseLayer: true,
            url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            attribution:
                "OpenStreetMap contributors",
        };
        return (
            <View style={{ flex: 1, width: "100%" }}>
                <ExpoLeaflet
                    mapLayers={[mapLayer]}
                    mapMarkers={ubicacionSeleccionada ? [ubicacionSeleccionada] : []}
                    mapCenterPosition={{ lat: ubicacionSeleccionada.position.lat, lng: ubicacionSeleccionada.position.lng }}
                    maxZoom={18}
                    zoom={18}
                    loadingIndicator={() => <ActivityIndicator style={{ height: "100%" }} animating={true} size={"large"} color={"black"} />}
                    onMessage={(message) => {
                        console.log(message)


                        if (message.tag === 'onMapClicked') {
                            const newMarker: MapMarker = {
                                id: "ubicacion-seleccionada",
                                position: { lat: message.location.lat, lng: message.location.lng },
                                icon: `<svg style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>`,
                                size: [15, 15],
                            }
                            setUbicacionSeleccionada(newMarker);
                        }
                    }}
                />
                <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
                    <Button mode="contained" contentStyle={{ height: "100%" }} style={{ width: "50%", borderRadius: 0, backgroundColor: "#ff3a30" }} onPress={() => {
                        setUbicacionSeleccionada(posInicial);
                        setEditarUbicacion(false)

                    }}>cancelar</Button>
                    <Button mode="contained" contentStyle={{ height: "100%" }} style={{
                        backgroundColor: "#386b38"
                        , width: "50%", borderRadius: 0
                    }} onPress={() => {
                        setData({ ...data, lng: ubicacionSeleccionada.position.lng, lat: ubicacionSeleccionada.position.lat })
                        setEditarUbicacion(false)


                    }}>LISTO</Button>
                </View>
            </View>
        )
    } else {

    }
    return (
        <View style={{ width: "100%", paddingHorizontal: 20, paddingTop: 10, flex: 1, backgroundColor: "white", gap: 10 }}>
            <View style={{ justifyContent: "space-between", width: "100%", alignItems: "center", flexDirection: "row" }}>
                <Button onPress={() => setModalVisible(false)}>Volver</Button>
                <Button mode="contained" onPress={() => setEditarUbicacion(true)} icon={'map-marker'}>cambiar ubicación</Button>
            </View>


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
                    <Text><Icon color='green' size={20} source={'map-marker'}/>Cliente</Text>
                </View>


                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                    <RadioButton
                        value="proveedor"

                        status={data.tipo === 'proveedor' ? 'checked' : 'unchecked'}
                        onPress={() => setData({ ...data, tipo: "proveedor" })}
                    />
                    <Text><Icon color='red' size={20} source={'map-marker'}/>Proveedor</Text>
                </View>


            </View>
            <TextInput
                label="Nota"
                value={data.nota}
                mode="outlined"
                activeOutlineColor='#000'
                onChangeText={text => setData({ ...data, nota: text })} />
            <Button mode='contained' onPress={editar}>Editar contacto</Button>
            <Snackbar style={{ backgroundColor: mensaje.error ? "#ff3a30" : "#386b38" }} rippleColor={"black"} visible={mensaje.bool} onDismiss={() => setMensaje({ ...mensaje, bool: false })}>{mensaje.texto}</Snackbar>
        </View>
    )
}

export default EditarContacto