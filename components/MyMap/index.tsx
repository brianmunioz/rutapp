import { View, ActivityIndicator, Linking, Text } from "react-native";
import React, { useEffect, useState } from "react";
import { ExpoLeaflet, MapLayer, MapMarker } from "expo-leaflet";
import * as Location from 'expo-location';
import { useSQLiteContext } from "expo-sqlite";
import { Button, Icon, Snackbar } from "react-native-paper";
import CrearContacto from "../Acciones/CrearContacto";
import ListEditar from "../lists/ListEditar";
import IcontactosSQL from "@/interfaces/IContactosSQL";
import IRepartosSQL from "@/interfaces/IRepartosSQL";
import CrearReparto from "../Acciones/CrearReparto";
const mapLayer: MapLayer = {
  baseLayerName: "OpenStreetMap",
  baseLayerIsChecked: true,
  layerType: "TileLayer",
  baseLayer: true,
  url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  attribution:
    "OpenStreetMap contributors",
};
interface ILocation {
  lat: number,
  lng: number
}

export default function MyMap() {
  const initPosWithoutLocation: ILocation = { lat: -35.103034508838604, lng: -59.50661499922906 };
  const [mapCenterPos, setMapCenterPos] = useState<ILocation>(initPosWithoutLocation);
  const [actualPos, setActualPos] = useState<ILocation>(initPosWithoutLocation);
  const [boolLocation, setBoolLocation] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(3);
  const [ownPosition, setOwnPosition] = useState<null | ILocation>(null)
  const [accionUsuario, setAccionUsuario] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false);
  const [markerTel, setMarkerTel] = useState({ id: 0, show: false, tel: 0 })
  const [dataMarkers, setDataMarkers] = useState<MapMarker[]>([])
  const [contactosArr, setContactosArr] = useState<IcontactosSQL[]>([])
  const [repartosArr, setRepartosArr] = useState<IRepartosSQL[]>([])

  const [editar, setEditar] = useState(false);
  const [mensajeSnack, setMensajeSnack] = useState({ bool: false, texto: "" });
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<MapMarker[]>([]);
  const [modoContacto, setModoContacto] = useState(true);

  const defaultZoom = ownPosition ? 18 : 3;

  useEffect(() => {
    if (ownPosition) {
      if (ownPosition.lat != actualPos.lat && ownPosition.lng != actualPos.lng && boolLocation === true) {
        setMapCenterPos({ lat: ownPosition.lat, lng: ownPosition.lng });
        setBoolLocation(false)
        setEditar(false);
      }
    }
  }, [boolLocation])
  const db = useSQLiteContext();
  const verUbicacionContacto = (lat: number, lng: number) => {
    setBoolLocation(true);
    setMapCenterPos({ lat, lng })
    setEditar(false)
    setAccionUsuario(null)

    setBoolLocation(false);

  }
  const eliminarContacto = async (e: string) => {
    await db.runAsync('DELETE FROM contactos WHERE id = $id', { $id: e }); // Binding named parameters from object
    pedircontactos();
  }
  const getLocationAsync = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync()
   

     await Location.getCurrentPositionAsync({}).then((e)=>{
      setOwnPosition({
        lat: e.coords.latitude,
        lng: e.coords.longitude,
      })
      setMapCenterPos({
        lat: e.coords.latitude,
        lng: e.coords.longitude,
      })
    })
    .catch(()=>{
      const index = dataMarkers.length -1;
      setMapCenterPos(dataMarkers && { lat: dataMarkers[index].position.lat, lng: dataMarkers[index].position.lng })

    })

   setBoolLocation(true)
    setZoom(17)


  }

  const pedircontactos = async () => {

    const contactossql: IcontactosSQL[] = await db.getAllAsync("SELECT * FROM contactos");
    setContactosArr(contactossql)
    const nuevoscontactos: MapMarker[] = contactossql.map((e) => {
      return {
        id: e.id.toString(),
        position: { lat: e.lat, lng: e?.lng },
        icon: `
        <div 
          style="position: relative; cursor: pointer;" 
          onclick="
            const tooltip = this.querySelector('.tooltip-${e.id}');
            const isVisible = tooltip.style.display === 'block';
      
            // Ajusta la opacidad de todos los otros pins
            document.querySelectorAll('.map-pin').forEach(pin => {
              pin.style.opacity = isVisible ? '1' : '0.2'; // Reduce la opacidad si el tooltip está abierto
              if (pin === this) {
                pin.style.opacity = '1'; // Asegura que el pin clickeado esté completamente visible
              }
            });
      
            // Alterna la visibilidad del tooltip
            document.querySelectorAll('.tooltip').forEach(t => t.style.display = 'none'); // Cierra otros tooltips
            tooltip.style.display = isVisible ? 'none' : 'block';  // Alterna la visibilidad del tooltip
      
            // Ajusta el z-index del pin actual
            this.style.zIndex = isVisible ? 1 : 9999;
          "
          class="map-pin"
        >
          <div style="z-index: 1; position: relative;"> 
          <svg fill=${e.tipo == "proveedor" ? 'red' : 'green'} style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>
          </div>
          <p 
            class="tooltip tooltip-${e.id}" 
            style="display:none; position:absolute;font-weight:600 ; white-space: nowrap; top:15px; left:15px; border-radius: 5px; background:white; color: #000; padding:5px; border:1px solid #ccc; z-index: 10000;" 
          >   <span style="font-weight: bold">${e.tipo.toUpperCase()}:</span> ${e.nombre} <br/>
            <span style="font-weight: bold">DIRECCIÓN:</span> ${e.direccion} <br/>
            <span style="font-weight: bold">TELÉFONO:</span> ${e.telefono || "no tiene"} <br/>
            <span style="font-weight: bold">NOTA:</span> ${e.notas || "no hay"}    
          </p>
        </div>`,
        size: [15, 15],
      }




    })

    setDataMarkers(nuevoscontactos)
  }

  const pedirRepartos = async () => {

    const repartosSQL: IRepartosSQL[] = await db.getAllAsync("SELECT * FROM repartos");
    setRepartosArr(repartosSQL)
    const nuevosrepartos: MapMarker[] = repartosSQL.map((e) => {
      return {
        id: e.id.toString(),
        position: { lat: e.lat, lng: e?.lng },
        icon: `
        <div 
          style="position: relative; cursor: pointer;" 
          onclick="
            const tooltip = this.querySelector('.tooltip-${e.id}');
            const isVisible = tooltip.style.display === 'block';
      
            // Ajusta la opacidad de todos los otros pins
            document.querySelectorAll('.map-pin').forEach(pin => {
              pin.style.opacity = isVisible ? '1' : '0.2'; // Reduce la opacidad si el tooltip está abierto
              if (pin === this) {
                pin.style.opacity = '1'; // Asegura que el pin clickeado esté completamente visible
              }
            });
      
            // Alterna la visibilidad del tooltip
            document.querySelectorAll('.tooltip').forEach(t => t.style.display = 'none'); // Cierra otros tooltips
            tooltip.style.display = isVisible ? 'none' : 'block';  // Alterna la visibilidad del tooltip
      
            // Ajusta el z-index del pin actual
            this.style.zIndex = isVisible ? 1 : 9999;
          "
          class="map-pin"
        >
          <div style="z-index: 1; position: relative;"> 
          <svg fill=${e.tipo == "proveedor" ? 'red' : 'green'} style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>
          </div>
          <p 
            class="tooltip tooltip-${e.id}" 
            style="display:none; position:absolute;font-weight:600 ; white-space: nowrap; top:15px; left:15px; border-radius: 5px; background:white; color: #000; padding:5px; border:1px solid #ccc; z-index: 10000;" 
          >   <span style="font-weight: bold">${e.tipo.toUpperCase()}:</span> ${e.nombre} <br/>
            <span style="font-weight: bold">DIRECCIÓN:</span> ${e.direccion} <br/>
            <span style="font-weight: bold">TELÉFONO:</span> ${e.telefono || "no tiene"} <br/>
            <span style="font-weight: bold">NOTA:</span> ${e.notas || "no hay"}    
          </p>
        </div>`,
        size: [15, 15],
      }




    })

    setDataMarkers(nuevosrepartos)
  }
  useEffect(() => {
    setAccionUsuario(null);
    setUbicacionSeleccionada([]);
    if (modoContacto) {
      pedircontactos()
    } else {
      pedirRepartos()
    }
    getLocationAsync().catch((error) => {
      console.error(error)
    })
  }, [modoContacto])





  const markers: MapMarker[] = [
    {
      id: "ubicacion",
      position: !ownPosition ? { lat: -38.72707, lng: -62.27592 } : ownPosition,
      icon: '<svg class="map-pin"style="width: 15px;height:15px;border-radius: 50%; padding: 3px; background-color: rgb(255, 132, 132); box-shadow: 0 0 5px rgba(255, 132, 132, 0.9);"xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>crosshairs-gps</title><path d="M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8M3.05,13H1V11H3.05C3.5,6.83 6.83,3.5 11,3.05V1H13V3.05C17.17,3.5 20.5,6.83 20.95,11H23V13H20.95C20.5,17.17 17.17,20.5 13,20.95V23H11V20.95C6.83,20.5 3.5,17.17 3.05,13M12,5A7,7 0 0,0 5,12A7,7 0 0,0 12,19A7,7 0 0,0 19,12A7,7 0 0,0 12,5Z" /></svg>',
      size: [12, 12],
    }
  ];



  const cambiarDeModo = () => {
    setModoContacto(!modoContacto)
  }
  const resetTodo = () => {
    if(modoContacto){
      pedircontactos();
    }else{
      pedirRepartos();
    }
    
    setUbicacionSeleccionada([]);
    setModalVisible(false);
    setAccionUsuario(null);
    setMarkerTel({ id: 0, show: false, tel: 0 });
  }
  return (
    <View style={{ flex: 1, width: "100%", justifyContent: 'center' }}>
      <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", width: "100%", height: 40 }}>
        <Text style={{ width: "100%", color: "white", textAlign: "center", letterSpacing: 3, justifyContent: "center", textTransform: "uppercase" }}> <Icon source={modoContacto ? "account-box" : "truck-fast-outline"} size={15} color="white"></Icon>{modoContacto ? "contactos" : "repartos"}{accionUsuario ? ' - ' + accionUsuario : ""}</Text>

      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", height: 50 }}>

        <Button contentStyle={{ height: "100%" }} buttonColor="#fdfd96" style={{ flex: 1, borderRadius: 0 }} onPress={() => cambiarDeModo()} mode="contained" ><Icon size={20} source={"sync"} color="black" /></Button>
        <Button contentStyle={{ height: "100%" }} buttonColor="rgb(255, 132, 132)" style={{ flex: 1, borderRadius: 0 }} mode="contained" onPress={
          () => {
            if (ownPosition) {
              setMapCenterPos(actualPos);
              setMarkerTel({ id: 0, show: false, tel: 0 })
              setAccionUsuario(null);

              setBoolLocation(true);
            }
          }} ><Icon size={20} source={"crosshairs-gps"} color="black" /></Button>
        {!modoContacto &&

          <Button contentStyle={{ height: "100%", flexDirection: "column" }} buttonColor="#FF9D3D" style={{ flex: 1, borderRadius: 0 }} mode="contained" onPress={() => {
            if (modoContacto) {
              setMarkerTel({ id: 0, show: false, tel: 0 })
              setEditar(true)
              setAccionUsuario('editar');
            } else {
              console.log("hola")
            }

          }}><Icon size={20} source={"map-marker"} color="black" /></Button>
        }


        <Button contentStyle={{ height: "100%" }} buttonColor="#77dd77" style={{ flex: 1, borderRadius: 0 }} mode="contained" onPress={() => {
          setMarkerTel({ id: 0, show: false, tel: 0 })
          setEditar(true)
          setAccionUsuario('editar');

        }}><Icon size={20} source={"playlist-edit"} color="black" /></Button>

        <Button onPress={() => {
          setEditar(false);
          setAccionUsuario(null);
          setMarkerTel({ id: 0, show: false, tel: 0 })
          setModalVisible(false)
        }} contentStyle={{ height: "100%" }} buttonColor="#e1e3e1" style={{ flex: 1, borderRadius: 0 }} mode="contained" ><Icon size={20} source={"earth-box"} color="black" /></Button>


        <Button textColor="black" contentStyle={{ height: 50 }} style={{ flex: 1, backgroundColor: "#FF6961", height: 50, borderRadius: 0, width: 70, justifyContent: "center" }} mode="contained" onPress={() => {
          setMarkerTel({ id: 0, show: false, tel: 0 })
          setAccionUsuario('crear');
          setEditar(false)

        }}
        ><Icon size={20} source={"map-marker-plus-outline"}></Icon></Button>
      </View>
      {editar && modoContacto &&
        <ListEditar pedirContactos={pedircontactos} datos={contactosArr} verUbicacion={verUbicacionContacto} eliminar={(e) => eliminarContacto(e)} />
      }
      {
        !modalVisible && !editar &&
        <ExpoLeaflet
          mapLayers={[mapLayer]}
          mapMarkers={accionUsuario === "crear" ? [...ubicacionSeleccionada,...dataMarkers] : [markers[0], ...dataMarkers]}
          mapCenterPosition={mapCenterPos}
          maxZoom={18}
          zoom={boolLocation ? zoom : defaultZoom}
          loadingIndicator={() => <ActivityIndicator style={{ height: "100%" }} animating={true} size={"large"} color={"black"} />}
          onMessage={(message) => {
            console.log(message)
            if (message.tag == "onMoveEnd") {
              setZoom(message.zoom)
              setActualPos(message.mapCenter)
            }

            if (message.tag === 'onMapClicked' && (accionUsuario == "crear")) {
              const newMarker: MapMarker = {
                id: "ubicacion-seleccionada",
                position: { lat: message.location.lat, lng: message.location.lng },
                icon: `<svg style="width:30px;height:30px" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><title>map-marker</title><path d="M12,11.5A2.5,2.5 0 0,1 9.5,9A2.5,2.5 0 0,1 12,6.5A2.5,2.5 0 0,1 14.5,9A2.5,2.5 0 0,1 12,11.5M12,2A7,7 0 0,0 5,9C5,14.25 12,22 12,22C12,22 19,14.25 19,9A7,7 0 0,0 12,2Z" /></svg>`,
                size: [15, 15],
              }
              setUbicacionSeleccionada([newMarker]);
            } else if (message.tag == "onMapMarkerClicked" && message.mapMarkerId !== "ubicacion") {
              const idMarker = parseInt(message.mapMarkerId);
              if (idMarker !== markerTel.id) {
                const findMarker: IcontactosSQL[] = contactosArr.filter(e => e.id === idMarker);
                console.log(findMarker)
                setMarkerTel({ id: idMarker, show: true, tel: findMarker[0]?.telefono || 0 })
              } else {
                setMarkerTel({ id: markerTel.id, show: !markerTel.show, tel: markerTel.tel })

              }

            }
          }}
        />
      }

      {
        modoContacto && accionUsuario === "crear" && ubicacionSeleccionada && modalVisible &&
        <CrearContacto resetTodo={resetTodo} ubicacionSeleccionada={ubicacionSeleccionada} setModalVisible={setModalVisible} />
      }
      {
        !modoContacto && accionUsuario === "crear" && ubicacionSeleccionada && modalVisible &&
        <CrearReparto contactos={contactosArr} resetTodo={resetTodo} ubicacionSeleccionada={ubicacionSeleccionada} setModalVisible={setModalVisible} />
      }
      {
        !modoContacto && accionUsuario == null&&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="contained" contentStyle={{ height: "100%" }} style={{ width: "100%", borderRadius: 0 }} onPress={() => {
            if (repartosArr.length > 0) {
              console.log("chevere wey");
            } else {
              setMensajeSnack({ bool: true, texto: "Debe crear repartos para poder empezar a repartir" })

            }
          }}>Empezar</Button>
        </View>
      }

      {accionUsuario === null && modoContacto && !editar &&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="contained" disabled={!markerTel.show} contentStyle={{ height: "100%", borderRightWidth: 1, borderRightColor: "#C0C0C0" }} style={{ width: "50%", borderRadius: 0, backgroundColor: !markerTel.show ? "#dcdcdc" : "#051b37" }} icon={"whatsapp"} onPress={() => markerTel.show && markerTel.tel !== 0 && Linking.openURL(`http://api.whatsapp.com/send?phone=${markerTel.tel}`)}>{markerTel.tel === 0 && markerTel.show ? "WHATSAPP (no tiene)" : "WHATSAPP"}</Button>
          <Button mode="contained" disabled={!markerTel.show} contentStyle={{ height: "100%" }} style={{ width: "50%", borderRadius: 0, backgroundColor: !markerTel.show ? "#dcdcdc" : "#051b37", borderLeftWidth: 1, borderLeftColor: "#737373" }} icon="phone" onPress={() => markerTel.show && markerTel.tel !== 0 && Linking.openURL(`tel:+${markerTel.tel}`)}>{markerTel.tel === 0 && markerTel.show ? "LLAMAR (no tiene número)" : "LLAMAR"}</Button>
        </View>}
      {accionUsuario === "crear"  && !modalVisible && !editar &&
        <View style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center", height: 50 }}>
          <Button mode="contained" contentStyle={{ height: "100%" }} style={{ width: "50%", borderRadius: 0, backgroundColor: "#ff3a30" }} onPress={() => {
              resetTodo();
              setEditar(false);
          
          }}>cancelar</Button>
          <Button mode="contained" contentStyle={{ height: "100%" }} style={{ backgroundColor: ubicacionSeleccionada.length > 0 ? "#386b38" : "#dcdcdc", width: "50%", borderRadius: 0 }} onPress={() => {
            if (ubicacionSeleccionada.length > 0) {
                setModalVisible(true)
              
            } else {
              setMensajeSnack({ bool: true, texto: "Debe seleccionar ubicación para poder seguir" })
            }

          }}>LISTO</Button>
        </View>
      }
      <Snackbar icon="alert" visible={mensajeSnack.bool} onDismiss={() => setMensajeSnack({ ...mensajeSnack, bool: false })}  >{mensajeSnack.texto}</Snackbar>
    </View>
  );
}