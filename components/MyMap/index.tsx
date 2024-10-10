import { View, ActivityIndicator, Alert } from "react-native";
import { Actionsheet, Button, Text, Center, HamburgerIcon, useDisclose, Box, Modal, FormControl, Input, Select, CheckIcon, WarningIcon, ChevronLeftIcon, ChevronRightIcon } from "native-base";

import React, { useEffect, useState } from "react";
import { ExpoLeaflet, MapLayer, MapMarker } from "expo-leaflet";
import * as Location from 'expo-location';
import { Fragment } from "react";
import CrearContacto from "../Modals/CrearContacto";
import { useSQLiteContext } from "expo-sqlite";


// Map Layer is based on OpenStreetMap, https://www.openstreetmap.org/#map=17/-25.35051/-51.47748
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
  const [allMarkers, setAllMarkers] = useState<MapMarker[]>([]);
  const [ownPosition, setOwnPosition] = useState<null | ILocation>(null)
  const [accionContacto, setAccionContacto] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false);
  const [contactos, setContactos] = useState<MapMarker[]>([])
  const [ubicacionSeleccionada, setUbicacionSeleccionada] = useState<MapMarker[]>([]);
  const db = useSQLiteContext();
  const {
    isOpen,
    onOpen,
    onClose
  } = useDisclose();
  const pedircontactos = async () => {
    interface contactosSQL {
      id: number,
      lat: number,
      lng: number,
      nombre: string,
      direccion: string,
      notas: string,
      tipo: string,
      telefono: number
    }
    const contactossql: contactosSQL[] = await db.getAllAsync("SELECT * FROM contactos");

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
            ${e.tipo == "proveedor" ? '🔵' : "🟣"}
          </div>
          <p 
            class="tooltip tooltip-${e.id}" 
            style="display:none; position:absolute;font-weight:600 ; white-space: nowrap; top:10px; left:10px; border-radius: 5px; background:white; color: #000; padding:5px; border:1px solid #ccc; z-index: 10000;" 
          >   <span style="font-weight: bold">${e.tipo.toUpperCase()}:</span> ${e.nombre} <br/>
            <span style="font-weight: bold">DIRECCIÓN:</span> ${e.direccion} <br/>
            <span style="font-weight: bold">TELÉFONO:</span> ${e.telefono} <br/>
            <span style="font-weight: bold">NOTA:</span> ${e.notas}    
          </p>
        </div>`,
        size: [15, 15],
      }
      
      
    

    })
    setContactos(nuevoscontactos)
  }
  useEffect(() => {

    pedircontactos()

  }, [])
  useEffect(() => {
    const getLocationAsync = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        console.warn('Permission to access location was denied')
      }

      let location = await Location.getCurrentPositionAsync({})
      if (!ownPosition) {
        setOwnPosition({
          lat: location.coords.latitude,
          lng: location.coords.longitude,
        })
      }
    }

    getLocationAsync().catch((error) => {
      console.error(error)
    })
  }, [])
  useEffect(() => {
    setAllMarkers(markers)

  }, [ownPosition])


  const markers: MapMarker[] = [
    {
      id: "1",
      position: !ownPosition ? { lat: -38.72707, lng: -62.27592 } : ownPosition,
      icon: '<div style="border-radius: 50%; padding: 3px; background-color: rgb(255, 132, 132); box-shadow: 0 0 10px rgba(255, 132, 132, 0.9);">👤</div>',
      size: [12, 12],
    }
    
  ];


  const [modoContacto, setModoContacto] = useState(true);
  const [mapCenterPos, setMapCenterPos] = useState<MapMarker>();

  const cambiarDeModo = () => {
    setModoContacto(!modoContacto)
  }
  const resetTodo = () => {
    setUbicacionSeleccionada([]);
    setAccionContacto(null)
  }



  return (
    <View style={{ flex: 1, width: "100%", justifyContent: 'center' }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", width: "100%", height: 50 }}>
        <Center>
          <Button backgroundColor={"#051b37"} onPress={onOpen}><HamburgerIcon style={{ width: "50px" }} color="#fff" /></Button>
          <Actionsheet isOpen={isOpen} onClose={onClose}>
            <Actionsheet.Content>
              {modoContacto ?
                <Fragment>
                  <Actionsheet.Item onPress={() => {
                    setAccionContacto('crear')
                    onClose()
                  }}>Crear nuevo contacto </Actionsheet.Item>
                  <Actionsheet.Item isDisabled>Ver listado</Actionsheet.Item>
                </Fragment>
                :
                <Fragment>
                  <Actionsheet.Item>Iniciar reparto </Actionsheet.Item>
                  <Actionsheet.Item isDisabled>Crear reparto </Actionsheet.Item>
                  <Actionsheet.Item isDisabled>Ver listado</Actionsheet.Item>
                </Fragment>
              }

              <Actionsheet.Item onPress={() => cambiarDeModo()}>{modoContacto ? "Cambiar a modo reparto" : "Cambiar a modo contacto"}</Actionsheet.Item>
            </Actionsheet.Content>
          </Actionsheet>
        </Center>
        <Text color={"#fff"} fontWeight={400} fontSize={10} textTransform={"uppercase"}>{modoContacto ? "contactos" : "repartos"}{accionContacto ? ' - ' + accionContacto : ""}</Text>

        <Button backgroundColor={"#e23131"} height={50} fontWeight={800} style={{ borderRadius: 0 }}>Mi ubicación</Button>
      </View>

      <ExpoLeaflet
        mapLayers={[mapLayer]}
        mapMarkers={accionContacto === "crear" ? ubicacionSeleccionada : [markers[0], ...contactos]}
        mapCenterPosition={!ownPosition ? { lat: -38.72707, lng: -62.27592 } : ownPosition}

        maxZoom={18}
        zoom={16}
        loadingIndicator={() => <ActivityIndicator />}
        onMessage={(message) => {
          console.log(message);
          if (message.tag === 'onMapClicked' && (accionContacto == "crear")) {
            const newMarker: MapMarker = {
              id: "23",
              position: { lat: message.location.lat, lng: message.location.lng },
              icon: `<div>🔴</div>`,
              size: [15, 15],
            }
            setUbicacionSeleccionada([newMarker]);
          }
        }}
      />
      {accionContacto === null && modoContacto &&
        <Box style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center" }}>
          <Button height={50} width={"50%"} borderRadius={0} backgroundColor={"#051b37"} ><ChevronLeftIcon /></Button>
          <Button height={50} width={"50%"} borderRadius={0} backgroundColor={"#051b37"} borderLeftWidth={1} borderLeftColor={"#737373"}><ChevronRightIcon /></Button>
        </Box>
      }
      {accionContacto === "crear" && modoContacto &&
        <Box style={{ position: "absolute", bottom: 0, flexDirection: "row", justifyContent: "center" }}>
          <Button height={50} width={"50%"} borderRadius={0} backgroundColor={"red.500"} onPress={() => resetTodo()}>cancelar</Button>
          <Button height={50} width={"50%"} borderRadius={0} backgroundColor={ubicacionSeleccionada.length > 0 ? "green.800" : "gray.600"} onPress={() => {
            if (ubicacionSeleccionada.length > 0) {
              setModalVisible(true)
            } else {
              Alert.alert("Debe marcar la ubicación de su nuevo contacto a crearse asi puede seguir con el siguiente paso")
            }

          }}>listo</Button>
        </Box>
      }

      {/*Modal de crear contacto */}
      <CrearContacto modalVisible={modalVisible} setModalVisible={setModalVisible} ubicacionSeleccionada={ubicacionSeleccionada} resetTodo={()=>{
        resetTodo();
        pedircontactos();
        }}></CrearContacto>


    </View>
  );
}