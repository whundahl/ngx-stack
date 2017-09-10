import { get } from 'lodash'
import { Injectable } from '@angular/core'
import { Router } from '@angular/router'
import { Effect, Actions } from '@ngrx/effects'
import { Action, Store } from '@ngrx/store'
import { Observable } from 'rxjs/Observable'
import { of } from 'rxjs/observable/of'
import { defer } from 'rxjs/observable/defer'
import { NgxUiService } from '../../ui'
import { AccountApi, LoopBackAuth } from '@ngx-plus/ngx-sdk'
import 'rxjs/add/operator/do'
import 'rxjs/add/operator/let'
import 'rxjs/add/operator/map'
import 'rxjs/add/operator/mergeMap'
import 'rxjs/add/operator/startWith'

import * as Auth from '../actions/auth.actions'
import * as Ui from '../actions/ui.actions'

@Injectable()
export class AuthEffects {
  constructor(
    private actions$: Actions,
    private store: Store<any>,
    private userApi: AccountApi,
    private ui: NgxUiService,
    private auth: LoopBackAuth,
    private router: Router,
  ) {}

  @Effect()
  public init$: Observable<Action> = defer(() => {
    return of(new Auth.LoadTokenSuccess(this.auth.getToken()))
  })

  @Effect({ dispatch: false })
  public loadTokenSuccess = this.actions$
    .ofType(Auth.LOAD_TOKEN_SUCCESS)
    .do(
      (action: Auth.LoadTokenSuccess) =>
        new Auth.LogInSuccess({ user: { id: action.payload.userId } }),
    )

  @Effect()
  protected logIn$: Observable<Action> = this.actions$
    .ofType(Auth.LOG_IN)
    .mergeMap((action: Auth.LogIn) =>
      this.userApi
        .login(action.payload, 'user', true)
        .map((response: any) => new Auth.LogInSuccess(response))
        .catch((error: any) => of(new Auth.LogInFail(error))),
    )

  @Effect({ dispatch: false })
  protected logInSuccess = this.actions$
    .ofType(Auth.LOG_IN_SUCCESS)
    .do((action: Auth.LogInSuccess) => this.router.navigate(['home']))
    .do((action: Auth.LogInSuccess) => {
      this.store.dispatch(new Auth.UpdateUser(action.payload.user.id))
      this.store.dispatch(new Ui.ActivateFooter())
      this.store.dispatch(new Ui.ActivateHeader())
      this.store.dispatch(new Ui.ActivateSidebar())
    })
    .do((action: Auth.LogInSuccess) =>
      this.ui.alerts.toastSuccess(
        'Log In Success',
        `You are logged in as <u><i>${action.payload.user.email}</u></i>.`,
      ),
    )

  @Effect({ dispatch: false })
  protected logInFail = this.actions$
    .ofType(Auth.LOG_IN_FAIL)
    .do((action: Auth.LogInFail) =>
      this.ui.alerts.toastError('Log In Failure', `${action.payload.message}`),
    )

  @Effect()
  protected register$: Observable<Action> = this.actions$
    .ofType(Auth.REGISTER)
    .mergeMap((action: Auth.Register) =>
      this.userApi
        .create(action.payload)
        .map((response: any) => new Auth.RegisterSuccess(response))
        .catch((error: any) => of(new Auth.RegisterFail(error))),
    )

  @Effect({ dispatch: false })
  protected registerSuccess = this.actions$
    .ofType(Auth.REGISTER_SUCCESS)
    .map((action: Auth.RegisterSuccess) => {
      this.router.navigate(['auth'])
      this.ui.alerts.toastSuccess(
        'Registration Success',
        `You have registered successfully as <u><i>${action.payload
          .email}</i></u>.`,
      )
    })

  @Effect({ dispatch: false })
  protected registerFail = this.actions$
    .ofType(Auth.REGISTER_FAIL)
    .map((action: Auth.RegisterFail) =>
      this.ui.alerts.toastError(
        get(action, 'payload.name'),
        get(action, 'payload.message'),
      ),
    )

  @Effect()
  protected logOut$: Observable<Action> = this.actions$
    .ofType(Auth.LOG_OUT)
    .mergeMap((action: Auth.LogOut) =>
      this.userApi
        .logout()
        .map((response: any) => new Auth.LogOutSuccess(response))
        .catch((error: any) => of(new Auth.LogOutFail(error))),
    )

  @Effect({ dispatch: false })
  protected logOutSuccess = this.actions$
    .ofType(Auth.LOG_OUT_SUCCESS)
    .do((action: Auth.LogOutSuccess) => this.router.navigate(['auth']))
    .map((action: Auth.LogOutSuccess) =>
      this.ui.alerts.toastSuccess(
        'Log Out Success',
        `You have logged out successfully.`,
      ),
    )

  @Effect({ dispatch: false })
  protected logOutFail = this.actions$
    .ofType(Auth.LOG_OUT_FAIL)
    .do((action: Auth.LogOutFail) => this.router.navigate(['auth']))
    .map((action: Auth.LogOutFail) =>
      this.ui.alerts.toastSuccess(
        'Log Out Success',
        `You have logged out successfully.`,
      ),
    )

  @Effect()
  protected checkToken$: Observable<Action> = this.actions$
    .ofType(Auth.CHECK_TOKEN)
    .mergeMap((action: Auth.CheckToken) =>
      this.userApi
        .getCurrent()
        .map((response: any) => new Auth.CheckTokenSuccess(response))
        .catch((error: any) => of(new Auth.CheckTokenFail(error))),
    )

  @Effect({ dispatch: false })
  protected checkTokenFail = this.actions$
    .ofType(Auth.CHECK_TOKEN_FAIL)
    .map((action: Auth.CheckTokenFail) => {
      this.router.navigate(['auth'])
      this.ui.alerts.toastError('Invalid Token', 'Redirecting to Log In screen')
    })

  @Effect({ dispatch: false })
  protected checkTokenSuccess = this.actions$
    .ofType(Auth.CHECK_TOKEN_SUCCESS)
    .map((action: Auth.CheckTokenSuccess) =>
      this.ui.alerts.toastSuccess(
        'Valid Token',
        `Your access token has been validated.`,
      ),
    )

  @Effect()
  protected updateUser$: Observable<Action> = this.actions$
    .ofType(Auth.UPDATE_USER)
    .mergeMap((action: Auth.UpdateUser) =>
      this.userApi
        .findById(action.payload, { include: 'roles' })
        .map((response: any) => {
          this.auth.setUser(response)
          return new Auth.UpdateUserSuccess(response)
        })
        .catch((error: any) => of(new Auth.UpdateUserFail(error))),
    )
}
