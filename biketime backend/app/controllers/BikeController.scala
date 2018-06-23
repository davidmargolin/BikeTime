package controllers

import org.mongodb.scala._
import javax.inject._
import play.api.mvc._
import controllers.Helpers._
import com.mongodb.MongoCredential._
import com.mongodb.connection.ClusterSettings
import play.api.libs.json.{JsObject, Json}
import org.mongodb.scala.model.Filters._
import org.mongodb.scala.model.Projections._
import collection.JavaConverters._
/**
  * This controller creates an `Action` to handle HTTP requests to the
  * application's home page.
  */


@Singleton
class BikeController @Inject()(cc: ControllerComponents) extends AbstractController(cc) {

  /**
    * Create an Action to render an HTML page with a welcome message.
    * The configuration in the `routes` file means that this method
    * will be called when the application receives a `GET` request with
    * a path of `/`.
    */
  val clusterSettings: ClusterSettings = ClusterSettings.builder().hosts(List(new ServerAddress("iad1-mongos0.objectrocket.com",16064)).asJava).build()

  val credential: MongoCredential = createCredential("webaccess", "citibikedata", "serverside1*".toCharArray)

  val settings: MongoClientSettings = MongoClientSettings.builder()

    .applyToClusterSettings((b: ClusterSettings.Builder) => b.applySettings(clusterSettings))
    .credential(credential)
    .build()

  val mongoClient: MongoClient = MongoClient(settings)
  val database: MongoDatabase = mongoClient.getDatabase("citibikedata")
  val collection: MongoCollection[Document] = database.getCollection("citibikedata")

  def getBike(bike: Int) = Action {
    var results = collection.find(and(equal("bikeid", bike),regex("starttime","^2018-05-06")))
    Ok(JsObject(Seq( "result"->Json.toJson(results.printResults()), "trips"->Json.toJson(results.results().length))))
  }

  def getAllBikes() = Action {
    var results = collection.find(regex("starttime","^2018-05-06")).projection(fields(include("bikeid"),excludeId()))
    var bikeset = results.printResults().toSet
    var bikelist = bikeset.map(item=>item("bikeid"))
    Ok(JsObject(Seq( "result"->Json.toJson(bikelist), "bikes"->Json.toJson(bikelist.size))))
  }

  def getAllForDay() = Action {
    var results = collection.find(regex("starttime","^2018-05-06")).printResults()
    Ok(JsObject(Seq( "result"->Json.toJson(results), "trips"->Json.toJson(results.length))))
  }

  def getAllForTimePref(time: String) = Action {
    var results = collection.find(regex("starttime","^"+time)).printResults()
    Ok(JsObject(Seq( "result"->Json.toJson(results), "trips"->Json.toJson(results.length))))
  }

}
