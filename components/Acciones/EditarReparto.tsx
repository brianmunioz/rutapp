import { ExpoLeaflet, MapLayer, MapMarker } from 'expo-leaflet';
import React, { useState } from 'react'
import { View } from 'react-native';
import { useSQLiteContext } from 'expo-sqlite';
import IDatosContacto from '@/interfaces/IDatosContacto';
import { ActivityIndicator, Button, Snackbar, TextInput } from 'react-native-paper';
import IRepartosSQL from '@/interfaces/IRepartosSQL';
import verificarTexto from '@/helpers/verificarTexto';


interface IProps {
    datos: IRepartosSQL,
    setModalVisible: (bool: boolean) => void,
    pedirContactos: () => void,
}
const EditarReparto: React.FC<IProps> = ({ setModalVisible, datos, pedirContactos }) => {
    const [mensaje, setMensaje] = useState({ bool: false, texto: "", error: true });
    const [data, setData] = useState<IDatosContacto>({ nombre: datos.nombre, tipo: datos.tipo, direccion: datos.direccion, telefono: datos.telefono == null ? "" : datos.telefono.toString(), descripcion: datos.descripcion, lat: datos.lat, lng: datos.lng,nota:'' });
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
        if ((datos.nombre && !data.nombre) || (!data.direccion && datos.direccion)) {
            setMensaje({ bool: true, texto: "Nombre y dirección no pueden estar vacios", error: true })
        }else if( !verificarTexto(data.nombre)){
            setMensaje({ bool: true, texto: `El campo NOMBRE contiene caracteres inválidos. Asegúrate de usar únicamente letras, números y los siguientes caracteres: $%,.-!?¿¡:;"'()`, error: true })
      
          } else if( !verificarTexto(data.direccion)){
            setMensaje({ bool: true, texto: `El campo DIRECCIÓN contiene caracteres inválidos. Asegúrate de usar únicamente letras, números y los siguientes caracteres: $%,.-!?¿¡:;"'()`, error: true })
      
          }else if( data.descripcion && !verificarTexto(data.descripcion)){
            setMensaje({ bool: true, texto: `El campo DESCRIPCIÓN contiene caracteres inválidos. Asegúrate de usar únicamente letras, números y los siguientes caracteres: $%,.-!?¿¡:;"'()`, error: true })      
          } else {
            const editarTodo = await db.runAsync('UPDATE repartos SET nombre = ?, direccion = ?, telefono = ?, descripcion=?, lat=?, lng=? WHERE id = ?', data.nombre, data.direccion, data.telefono != null ? parseInt(data.telefono) : null, data.descripcion ? data.descripcion :'', data.lat, data.lng, datos.id);
            setMensaje({ bool: true, texto: "Reparto editado con éxito, en breve se dirigirá a la lista de repartos", error: false })
            pedirContactos();
            setTimeout(()=>{
                setModalVisible(false)
            },1000)
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
    }
    return (
        <View style={{ width: "100%", paddingHorizontal: 20, paddingTop: 10, flex: 1, backgroundColor: "white", gap: 10 }}>
            <View style={{ justifyContent: "space-between", width: "100%", alignItems: "center", flexDirection: "row" }}>
                <Button onPress={() => setModalVisible(false)}>Volver</Button>
                {!datos.IDContacto &&
                    <Button mode="contained" onPress={() => setEditarUbicacion(true)} icon={'map-marker'}>cambiar ubicación</Button>
                }
            </View>

                    <TextInput
                        label="Nombre"
                        disabled={!datos.IDContacto?false:true}
                        value={data.nombre}
                        mode="outlined"
                        activeOutlineColor='#000'
                        onChangeText={text => setData({ ...data, nombre: text })} />
                    <TextInput
                        label="Dirección"
                        value={data.direccion}
                        disabled={!datos.IDContacto?false:true}
                        mode="outlined"
                        activeOutlineColor='#000'
                        onChangeText={text => setData({ ...data, direccion: text })} />
                    <View style={{ display: "flex", justifyContent: "flex-start", flexDirection: "row", gap: 5 }}>
                        <TextInput
                            label="Número de telefono"
                            keyboardType='numeric'
                            value={data.telefono}
                            disabled={!datos.IDContacto?false:true}
                            mode="outlined"
                            style={{ width: "70%" }}
                            activeOutlineColor='#000'
                            onChangeText={text => setData({ ...data, telefono: text })} />
                    </View>
            <TextInput
                label="Descripción"
                multiline
                value={data.descripcion}
                mode="outlined"
                activeOutlineColor='#000'
                onChangeText={text => setData({ ...data, descripcion: text })} />
            <Button mode='contained' onPress={editar}>Editar reparto</Button>
            <Snackbar style={{ backgroundColor: mensaje.error ? "#740938" : "#386b38" }} rippleColor={"black"} visible={mensaje.bool} onDismiss={() => setMensaje({ ...mensaje, bool: false })}>{mensaje.texto}</Snackbar>
        </View>
    )
}

export default EditarReparto